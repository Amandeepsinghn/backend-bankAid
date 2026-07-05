import { describe, it, expect } from 'vitest';
import { createOrderSchema, verifyPaymentSchema } from './subscription.requestHygiene';
import { validateAmountAgainstTier } from '../../lib/tierValidation';

const VALID_SIGNATURE = 'a'.repeat(64); // 64-char lowercase hex string

describe('Subscription Request Hygiene', () => {
  describe('createOrderSchema', () => {
    it('accepts valid tiers', () => {
      expect(createOrderSchema.safeParse({ tier: 'basic' }).success).toBe(true);
      expect(createOrderSchema.safeParse({ tier: 'standard' }).success).toBe(true);
      expect(createOrderSchema.safeParse({ tier: 'premium' }).success).toBe(true);
    });

    it('rejects invalid tier', () => {
      expect(createOrderSchema.safeParse({ tier: 'gold' }).success).toBe(false);
    });
  });

  describe('verifyPaymentSchema', () => {
    it('validates a complete payment payload with a real-format signature', () => {
      const result = verifyPaymentSchema.safeParse({
        razorpayOrderId: 'order_NJygotua4outdV',
        razorpayPaymentId: 'pay_NJygotua4outdV',
        razorpaySignature: VALID_SIGNATURE,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      const result = verifyPaymentSchema.safeParse({
        razorpayOrderId: 'order_NJygotua4outdV',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a non-hex signature', () => {
      const result = verifyPaymentSchema.safeParse({
        razorpayOrderId: 'order_NJygotua4outdV',
        razorpayPaymentId: 'pay_NJygotua4outdV',
        razorpaySignature: 'not-a-valid-signature',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a signature shorter than 64 characters', () => {
      const result = verifyPaymentSchema.safeParse({
        razorpayOrderId: 'order_NJygotua4outdV',
        razorpayPaymentId: 'pay_NJygotua4outdV',
        razorpaySignature: 'abcdef',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a signature with uppercase hex characters', () => {
      const result = verifyPaymentSchema.safeParse({
        razorpayOrderId: 'order_NJygotua4outdV',
        razorpayPaymentId: 'pay_NJygotua4outdV',
        razorpaySignature: 'A'.repeat(64),
      });
      expect(result.success).toBe(false);
    });

    it('rejects an order ID that exceeds the max length', () => {
      const result = verifyPaymentSchema.safeParse({
        razorpayOrderId: 'o'.repeat(101),
        razorpayPaymentId: 'pay_NJygotua4outdV',
        razorpaySignature: VALID_SIGNATURE,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Tier Validation', () => {
  it('validates basic tier range', () => {
    expect(validateAmountAgainstTier('basic', 5000).valid).toBe(true);
    expect(validateAmountAgainstTier('basic', 10000).valid).toBe(true);
    expect(validateAmountAgainstTier('basic', 10000.01).valid).toBe(false);
  });

  it('validates standard tier range', () => {
    expect(validateAmountAgainstTier('standard', 10000.01).valid).toBe(true);
    expect(validateAmountAgainstTier('standard', 50000).valid).toBe(true);
    expect(validateAmountAgainstTier('standard', 100000).valid).toBe(true);
    expect(validateAmountAgainstTier('standard', 100001).valid).toBe(false);
  });

  it('validates premium tier range', () => {
    expect(validateAmountAgainstTier('premium', 100000.01).valid).toBe(true);
    expect(validateAmountAgainstTier('premium', 500000).valid).toBe(true);
    expect(validateAmountAgainstTier('premium', 100000).valid).toBe(false);
  });

  it('returns correct reason for exceeding tier', () => {
    const result = validateAmountAgainstTier('basic', 15000);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('exceeds_tier');
    }
  });

  it('returns correct reason for below tier', () => {
    const result = validateAmountAgainstTier('standard', 5000);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('below_tier');
    }
  });
});
