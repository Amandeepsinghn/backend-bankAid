export type Tier = 'basic' | 'standard' | 'premium';

const tierRanges: Record<Tier, { min: number; max: number }> = {
  basic: { min: 0, max: 10000 },
  standard: { min: 10000.01, max: 100000 },
  premium: { min: 100000.01, max: Infinity },
};

export const TIER_PRICES: Record<Tier, number> = {
  basic: 19900,
  standard: 29900,
  premium: 49900,
};

export const TIER_CASE_LIMITS: Record<Tier, number> = {
  basic: 1,
  standard: 2,
  premium: 3,
};

export function validateAmountAgainstTier(tier: Tier, enteredAmount: number) {
  const range = tierRanges[tier];
  if (enteredAmount >= range.min && enteredAmount <= range.max) {
    return { valid: true as const };
  }
  return {
    valid: false as const,
    reason: enteredAmount > range.max ? 'exceeds_tier' : 'below_tier',
  };
}
