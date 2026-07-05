import { z } from 'zod';

export const createOrderSchema = z.object({
  tier: z.enum(['basic', 'standard', 'premium']),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Order ID is required').max(100),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required').max(100),
  // Razorpay signatures are HMAC-SHA256 hex digests — exactly 64 lowercase hex characters.
  razorpaySignature: z
    .string()
    .regex(/^[a-f0-9]{64}$/, 'Signature must be a 64-character lowercase hex string'),
});
