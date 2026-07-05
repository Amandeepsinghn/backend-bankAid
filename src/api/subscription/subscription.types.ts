import type { Tier } from '../../lib/tierValidation';

export interface CreateOrderInput {
  tier: Tier;
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PlanInfo {
  tier: Tier;
  label: string;
  amountRange: string;
  priceDisplay: string;
  pricePaise: number;
  caseLimit: number;
  support: string[];
  isValuePack: boolean;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: {
    id: string;
    tier: Tier;
    status: string;
    createdAt: Date;
  } | null;
  casesUsed: number;
  caseLimit: number;
  casesRemaining: number;
}
