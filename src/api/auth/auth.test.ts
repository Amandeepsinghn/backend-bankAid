import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  verifyPhoneSchema,
  resetPasswordSchema,
  refreshSchema,
  logoutSchema,
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

  describe('verifyPhoneSchema', () => {
    it('validates correct OTP payload', () => {
      const result = verifyPhoneSchema.safeParse({
        phone: '+919876543210',
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-6-digit code', () => {
      const result = verifyPhoneSchema.safeParse({
        phone: '+919876543210',
        code: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric OTP code', () => {
      const result = verifyPhoneSchema.safeParse({
        phone: '+919876543210',
        code: 'abcdef',
      });
      expect(result.success).toBe(false);
    });

    it('rejects OTP code with special characters', () => {
      const result = verifyPhoneSchema.safeParse({
        phone: '+919876543210',
        code: '!@#$%^',
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
