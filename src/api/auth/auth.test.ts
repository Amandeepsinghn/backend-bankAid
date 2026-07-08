import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  verifyEmailOtpSchema,
  resendEmailOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  logoutSchema,
  verifyResetOtpSchema,
} from './auth.requestHygiene';

const VALID_REFRESH_TOKEN = 'a'.repeat(96); // 96 lowercase hex chars — matches randomBytes(48).toString('hex')

describe('Auth Request Hygiene', () => {
  describe('registerSchema', () => {
    it('validates a correct registration payload', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        phone: '+919876543210',
        fullName: 'Uttam Yadav',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
        phone: '+919876543210',
        fullName: 'Uttam Yadav',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: '123',
        phone: '+919876543210',
        fullName: 'Uttam Yadav',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password over 128 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'a'.repeat(129),
        phone: '+919876543210',
        fullName: 'Uttam Yadav',
      });
      expect(result.success).toBe(false);
    });

    it('rejects fullName over 100 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        phone: '+919876543210',
        fullName: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid phone format', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        phone: '9876543210',
        fullName: 'Uttam Yadav',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a payload with no phone', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        fullName: 'Uttam Yadav',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates correct login payload', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('verifyResetOtpSchema', () => {
    it('validates a correct email + code payload', () => {
      const result = verifyResetOtpSchema.safeParse({
        email: 'user@example.com',
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid email', () => {
      const result = verifyResetOtpSchema.safeParse({
        email: 'not-an-email',
        code: '123456',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyEmailOtpSchema', () => {
    it('validates a correct email + code payload', () => {
      const result = verifyEmailOtpSchema.safeParse({
        email: 'user@example.com',
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a non-6-digit code', () => {
      const result = verifyEmailOtpSchema.safeParse({
        email: 'user@example.com',
        code: '12345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resendEmailOtpSchema', () => {
    it('validates a correct email payload', () => {
      expect(resendEmailOtpSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
    });

    it('rejects an invalid email', () => {
      expect(resendEmailOtpSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    });

    it('rejects a missing email', () => {
      expect(resendEmailOtpSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('validates a correct email + phone payload', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'user@example.com',
        phone: '+919876543210',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a missing phone', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid phone format', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'user@example.com',
        phone: '9876543210',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshSchema', () => {
    it('accepts a valid 96-char lowercase hex token', () => {
      expect(refreshSchema.safeParse({ refreshToken: VALID_REFRESH_TOKEN }).success).toBe(true);
    });

    it('rejects a token shorter than 96 characters', () => {
      expect(refreshSchema.safeParse({ refreshToken: 'a'.repeat(95) }).success).toBe(false);
    });

    it('rejects a token longer than 96 characters', () => {
      expect(refreshSchema.safeParse({ refreshToken: 'a'.repeat(97) }).success).toBe(false);
    });

    it('rejects a token containing uppercase hex characters', () => {
      expect(refreshSchema.safeParse({ refreshToken: 'A'.repeat(96) }).success).toBe(false);
    });

    it('rejects a token with non-hex characters', () => {
      expect(refreshSchema.safeParse({ refreshToken: 'z'.repeat(96) }).success).toBe(false);
    });

    it('rejects an empty token', () => {
      expect(refreshSchema.safeParse({ refreshToken: '' }).success).toBe(false);
    });
  });

  describe('logoutSchema', () => {
    it('accepts a valid 96-char lowercase hex token', () => {
      expect(logoutSchema.safeParse({ refreshToken: VALID_REFRESH_TOKEN }).success).toBe(true);
    });

    it('rejects a malformed token', () => {
      expect(logoutSchema.safeParse({ refreshToken: 'not-a-token' }).success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('rejects mismatched passwords', () => {
      const result = resetPasswordSchema.safeParse({
        resetToken: 'some-token',
        newPassword: 'password123',
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
    });

    it('validates matching passwords', () => {
      const result = resetPasswordSchema.safeParse({
        resetToken: 'some-token',
        newPassword: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects reset token over 2048 characters', () => {
      const result = resetPasswordSchema.safeParse({
        resetToken: 'x'.repeat(2049),
        newPassword: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });
});
