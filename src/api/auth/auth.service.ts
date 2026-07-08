import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { sendEmail } from '../../config/zeptomail';
import { renderOtpEmail } from '../../lib/otpEmailTemplate';
import { AppError } from '../../middleware/error/errorHandler';
import * as authDb from './auth.db';
import * as otpDb from './auth.otp.db';
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailOtpInput,
  ResendEmailOtpInput,
  ForgotPasswordInput,
  VerifyResetOtpInput,
  ResetPasswordInput,
} from './auth.types';

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
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

interface OtpEmailCopy {
  subject: string;
  heading: string;
  intro: string;
}

const EMAIL_VERIFICATION_COPY: OtpEmailCopy = {
  subject: 'Verify your Unfreeze account',
  heading: 'Verify your email',
  intro:
    "Welcome to Unfreeze! Use the code below to verify your email address and finish setting up your account.",
};

const PASSWORD_RESET_COPY: OtpEmailCopy = {
  subject: 'Your Unfreeze password reset code',
  heading: 'Reset your password',
  intro:
    "We received a request to reset your Unfreeze account password. Use the code below to continue.",
};

// Shared by every OTP-sending flow (register, resend, forgot-password): enforces
// a resend cooldown, invalidates any still-pending code for the same
// identifier+type so only the freshly issued one works, then sends the new one.
async function issueOtp(identifier: string, type: otpDb.OtpType, copy: OtpEmailCopy) {
  const latest = await otpDb.findLatestOtp(identifier, type);
  if (latest) {
    const secondsSinceLastSend = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
      throw new AppError(429, `Please wait ${waitSeconds}s before requesting another OTP`);
    }
    await otpDb.invalidatePendingOtps(identifier, type);
  }

  const code = generateOtp();
  await otpDb.createOtp(identifier, code, type, OTP_EXPIRY_MINUTES);
  await sendEmail(
    { address: identifier },
    copy.subject,
    renderOtpEmail({ heading: copy.heading, intro: copy.intro, code, expiryMinutes: OTP_EXPIRY_MINUTES }),
  );
}

export async function register(input: RegisterInput) {
  const existingEmail = await authDb.findProfileByEmail(input.email);
  if (existingEmail) {
    throw new authDb.ProfileConflictError('email');
  }
  const existingPhone = await authDb.findProfileByPhone(input.phone);
  if (existingPhone) {
    throw new authDb.ProfileConflictError('phone');
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Send the verification OTP BEFORE creating the account — if email delivery
  // fails, nothing is persisted, so the user can just retry registration
  // instead of getting stuck with an unverifiable account that blocks retries
  // with a 409 "already registered".
  await issueOtp(input.email, 'email_verification', EMAIL_VERIFICATION_COPY);

  const profile = await authDb.createProfile({
    email: input.email,
    password: hashedPassword,
    fullName: input.fullName,
    phone: input.phone,
  });

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    message: 'OTP sent to your email for verification',
  };
}

export async function resendEmailOtp(input: ResendEmailOtpInput) {
  const profile = await authDb.findProfileByEmail(input.email);
  if (!profile) {
    throw new AppError(404, 'No account found with this email');
  }
  if (profile.emailVerified) {
    throw new AppError(400, 'Email is already verified. Please log in.');
  }

  await issueOtp(profile.email, 'email_verification', EMAIL_VERIFICATION_COPY);

  return { message: 'OTP resent to your email' };
}

export async function verifyEmailOtp(input: VerifyEmailOtpInput) {
  const otp = await otpDb.findValidOtp(input.email, input.code, 'email_verification');
  if (!otp) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  await otpDb.markOtpVerified(otp.id);

  const profile = await authDb.markEmailVerified(input.email);
  if (!profile) {
    throw new AppError(404, 'Profile not found for this email address');
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
      emailVerified: profile.emailVerified,
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

  if (!profile.emailVerified) {
    throw new AppError(403, 'Email not verified. Please verify your email first.');
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
      emailVerified: profile.emailVerified,
    },
  };
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const profile = await authDb.findProfileByEmail(input.email);
  if (!profile) {
    throw new AppError(404, 'No account found with this email');
  }

  // Only checked when the account has a phone on file — most accounts won't,
  // since phone isn't collected at registration.
  if (profile.phone && profile.phone !== input.phone) {
    throw new AppError(404, 'No account found with this email and phone number combination');
  }

  // Calling this again (e.g. the "Resend OTP" button) reissues a fresh code,
  // subject to the same cooldown/invalidation rules as any other OTP send.
  await issueOtp(profile.email, 'password_reset', PASSWORD_RESET_COPY);

  return {
    email: profile.email,
    message: 'OTP sent to your registered email address',
  };
}

export async function verifyResetOtp(input: VerifyResetOtpInput) {
  const otp = await otpDb.findValidOtp(input.email, input.code, 'password_reset');
  if (!otp) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  await otpDb.markOtpVerified(otp.id);

  const profile = await authDb.findProfileByEmail(input.email);
  if (!profile) {
    throw new AppError(404, 'No account found for this email');
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
    emailVerified: profile.emailVerified,
    createdAt: profile.createdAt,
  };
}
