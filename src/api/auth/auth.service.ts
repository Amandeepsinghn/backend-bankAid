import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { twilioClient } from '../../config/twilio';
import { AppError } from '../../middleware/error/errorHandler';
import * as authDb from './auth.db';
import * as otpDb from './auth.otp.db';
import type {
  RegisterInput,
  LoginInput,
  VerifyPhoneInput,
  ForgotPasswordInput,
  VerifyResetOtpInput,
  ResetPasswordInput,
} from './auth.types';

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function signToken(payload: object, expiresIn: string): string {
  return jwt.sign(payload, env.JWT_SECRET, { algorithm: 'HS256', expiresIn } as SignOptions);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueSession(userId: string) {
  const accessToken = signToken({ userId, type: 'auth' }, ACCESS_TOKEN_TTL);

  const refreshToken = crypto.randomBytes(48).toString('hex');
  await authDb.createRefreshToken({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
}

async function sendSms(to: string, body: string) {
  await twilioClient.messages.create({
    to,
    from: env.TWILIO_PHONE_NUMBER,
    body,
  });
}

export async function register(input: RegisterInput) {
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const profile = await authDb.createProfile({
    email: input.email,
    password: hashedPassword,
    fullName: input.fullName,
    phone: input.phone,
  });

  const code = generateOtp();
  await otpDb.createOtp(input.phone, code, 'phone_verification', OTP_EXPIRY_MINUTES);
  await sendSms(input.phone, `Your Bank Aid verification code is: ${code}`);

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    message: 'OTP sent to your phone for verification',
  };
}

export async function verifyPhone(input: VerifyPhoneInput) {
  const otp = await otpDb.findValidOtp(input.phone, input.code, 'phone_verification');
  if (!otp) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  await otpDb.markOtpVerified(otp.id);

  const profile = await authDb.markPhoneVerified(input.phone);
  if (!profile) {
    throw new AppError(404, 'Profile not found for this phone number');
  }

  const { accessToken, refreshToken } = await issueSession(profile.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phone,
      phoneVerified: profile.phoneVerified,
    },
  };
}

export async function login(input: LoginInput) {
  const profile = await authDb.findProfileByEmail(input.email);
  if (!profile) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(input.password, profile.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (!profile.phoneVerified) {
    throw new AppError(403, 'Phone number not verified. Please verify your phone first.');
  }

  const { accessToken, refreshToken } = await issueSession(profile.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phone,
      phoneVerified: profile.phoneVerified,
    },
  };
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const profile = await authDb.findProfileByEmail(input.email);
  if (!profile) {
    throw new AppError(404, 'No account found with this email');
  }

  const code = generateOtp();
  await otpDb.createOtp(profile.phone, code, 'password_reset', OTP_EXPIRY_MINUTES);
  await sendSms(profile.phone, `Your Bank Aid password reset code is: ${code}`);

  const maskedPhone = profile.phone.slice(0, 4) + '****' + profile.phone.slice(-2);

  return {
    phone: maskedPhone,
    message: 'OTP sent to your registered phone number',
  };
}

export async function verifyResetOtp(input: VerifyResetOtpInput) {
  const otp = await otpDb.findValidOtp(input.phone, input.code, 'password_reset');
  if (!otp) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  await otpDb.markOtpVerified(otp.id);

  const profile = await authDb.findProfileByPhone(input.phone);
  if (!profile) {
    throw new AppError(404, 'No account found for this phone number');
  }

  const resetToken = signToken({ userId: profile.id, type: 'reset', otpId: otp.id }, '15m');

  return { resetToken };
}

export async function resetPassword(input: ResetPasswordInput) {
  let decoded: { userId: string; type: string; otpId: string };
  try {
    decoded = jwt.verify(input.resetToken, env.JWT_SECRET, { algorithms: ['HS256'] }) as {
      userId: string;
      type: string;
      otpId: string;
    };
  } catch {
    throw new AppError(400, 'Invalid or expired reset token');
  }

  if (decoded.type !== 'reset') {
    throw new AppError(400, 'Invalid reset token');
  }

  const consumed = await otpDb.consumeResetToken(decoded.otpId);
  if (!consumed) {
    throw new AppError(400, 'Reset token has already been used');
  }

  const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  const updated = await authDb.updatePassword(decoded.userId, hashedPassword);

  if (!updated) {
    throw new AppError(404, 'User not found');
  }

  return { message: 'Password reset successfully' };
}

export async function refreshSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const stored = await authDb.findActiveRefreshTokenByHash(tokenHash);

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  await authDb.revokeRefreshToken(stored.id);

  const { accessToken, refreshToken: newRefreshToken } = await issueSession(stored.userId);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  const stored = await authDb.findActiveRefreshTokenByHash(hashToken(refreshToken));
  if (stored) {
    await authDb.revokeRefreshToken(stored.id);
  }
  return { message: 'Logged out successfully' };
}

export async function getProfile(userId: string) {
  const profile = await authDb.findProfileById(userId);
  if (!profile) {
    throw new AppError(404, 'Profile not found');
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    phoneVerified: profile.phoneVerified,
    createdAt: profile.createdAt,
  };
}
