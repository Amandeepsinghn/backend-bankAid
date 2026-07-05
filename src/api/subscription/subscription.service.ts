import { razorpayInstance } from '../../config/razorpay';
import { verifyRazorpaySignature, verifyRazorpayWebhookSignature } from '../../lib/razorpay';
import { TIER_PRICES, TIER_CASE_LIMITS, type Tier } from '../../lib/tierValidation';
import { AppError } from '../../middleware/error/errorHandler';
import * as subscriptionDb from './subscription.db';
import * as formDb from '../form/form.db';
import type { PlanInfo } from './subscription.types';

export function getPlans(): PlanInfo[] {
  return [
    {
      tier: 'basic',
      label: 'Basic',
      amountRange: 'Up to ₹10,000',
      priceDisplay: '₹199',
      pricePaise: TIER_PRICES.basic,
      caseLimit: TIER_CASE_LIMITS.basic,
      support: [],
      isValuePack: false,
    },
    {
      tier: 'standard',
      label: 'Standard',
      amountRange: '₹10,000.01 – ₹1,00,000',
      priceDisplay: '₹299',
      pricePaise: TIER_PRICES.standard,
      caseLimit: TIER_CASE_LIMITS.standard,
      support: ['Telegram support channel'],
      isValuePack: true,
    },
    {
      tier: 'premium',
      label: 'Premium',
      amountRange: 'Above ₹1,00,000',
      priceDisplay: '₹499',
      pricePaise: TIER_PRICES.premium,
      caseLimit: TIER_CASE_LIMITS.premium,
      support: ['Call support', 'Telegram support channel'],
      isValuePack: false,
    },
  ];
}

export async function createOrder(userId: string, tier: Tier) {
  const amount = TIER_PRICES[tier];

  // Razorpay caps `receipt` at 40 chars — a full UUID + timestamp overflows it,
  // so use a shortened userId prefix; the full userId is preserved in `notes`.
  const receipt = `${userId.replace(/-/g, '').slice(0, 12)}_${Date.now().toString(36)}`;

  let order;
  try {
    order = await razorpayInstance.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: { tier, userId },
    });
  } catch (err) {
    const razorpayError = err as { statusCode?: number; error?: { description?: string } };
    throw new AppError(
      502,
      razorpayError.error?.description
        ? `Payment initiation failed: ${razorpayError.error.description}`
        : 'Payment initiation failed. Please try again.',
    );
  }

  await subscriptionDb.createSubscription({
    userId,
    tier,
    razorpayOrderId: order.id,
    amountPaise: amount,
  });

  return {
    orderId: order.id,
    amount,
    currency: 'INR',
    tier,
  };
}

export async function verifyPayment(
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) {
  const existing = await subscriptionDb.getSubscriptionByOrderId(razorpayOrderId);
  if (!existing || existing.userId !== userId) {
    throw new AppError(404, 'Subscription not found for this order');
  }

  // Idempotent: a retried verification call for an already-paid order is a no-op success.
  if (existing.status === 'paid') {
    return {
      verified: true,
      subscription: { id: existing.id, tier: existing.tier, status: existing.status },
    };
  }

  const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  if (!isValid) {
    await subscriptionDb.markSubscriptionFailed(razorpayOrderId);
    throw new AppError(400, 'Invalid payment signature');
  }

  const subscription = await subscriptionDb.markSubscriptionPaidIfPending(
    razorpayOrderId,
    razorpayPaymentId,
  );

  if (!subscription) {
    throw new AppError(409, 'Subscription already processed');
  }

  return {
    verified: true,
    subscription: {
      id: subscription.id,
      tier: subscription.tier,
      status: subscription.status,
    },
  };
}

export async function handleRazorpayWebhook(rawBody: Buffer, signature: string | undefined) {
  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    throw new AppError(400, 'Invalid webhook signature');
  }

  const payload = JSON.parse(rawBody.toString('utf8')) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };

  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    const entity = payload.payload?.payment?.entity;
    if (entity?.order_id && entity?.id) {
      await subscriptionDb.markSubscriptionPaidIfPending(entity.order_id, entity.id);
    }
  }

  return { received: true };
}

export async function getSubscriptionStatus(userId: string) {
  const subscription = await subscriptionDb.getActiveSubscription(userId);

  if (!subscription) {
    return {
      hasActiveSubscription: false,
      subscription: null,
      casesUsed: 0,
      caseLimit: 0,
      casesRemaining: 0,
    };
  }

  const tier = subscription.tier as Tier;
  const casesUsed = await formDb.countCasesBySubscription(subscription.id);
  const caseLimit = TIER_CASE_LIMITS[tier];

  return {
    hasActiveSubscription: true,
    subscription: {
      id: subscription.id,
      tier,
      status: subscription.status,
      createdAt: subscription.createdAt,
    },
    casesUsed,
    caseLimit,
    casesRemaining: Math.max(0, caseLimit - casesUsed),
  };
}
