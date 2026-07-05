import { z } from 'zod';

const emailField = z.string().email('Invalid email address').max(254);
const phoneField = z.string().regex(/^\+\d{10,15}$/, 'Phone must be in E.164 format (e.g., +919876543210)');
const passwordField = (label: string) =>
  z.string().min(8, `${label} must be at least 8 characters`).max(128, `${label} too long`);
const otpCodeField = z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits');

export const registerSchema = z.object({
  email: emailField,
  password: passwordField('Password'),
  phone: phoneField,
  fullName: z.string().min(2, 'Full name is required').max(100, 'Full name too long'),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').max(128),
});

export const verifyPhoneSchema = z.object({
  phone: phoneField,
  code: otpCodeField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const verifyResetOtpSchema = z.object({
  phone: phoneField,
  code: otpCodeField,
});

// Refresh tokens are crypto.randomBytes(48).toString('hex') — always 96 lowercase hex chars.
const refreshTokenField = z
  .string()
  .regex(/^[a-f0-9]{96}$/, 'Invalid refresh token format');

export const refreshSchema = z.object({
  refreshToken: refreshTokenField,
});

export const logoutSchema = z.object({
  refreshToken: refreshTokenField,
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, 'Reset token is required').max(2048),
    newPassword: passwordField('Password'),
    confirmPassword: passwordField('Confirm password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
