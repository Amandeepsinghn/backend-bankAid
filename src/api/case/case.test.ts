import { describe, it, expect } from 'vitest';
import { caseIdParamSchema } from './case.requestHygiene';
import { TIER_CASE_LIMITS } from '../../lib/tierValidation';

describe('Case Request Hygiene', () => {
  it('validates UUID for case ID', () => {
    expect(
      caseIdParamSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
    ).toBe(true);
  });

  it('rejects non-UUID case ID', () => {
    expect(
      caseIdParamSchema.safeParse({ id: 'not-a-uuid' }).success,
    ).toBe(false);
  });
});

describe('Tier Case Limits', () => {
  it('basic plan allows 1 case', () => {
    expect(TIER_CASE_LIMITS.basic).toBe(1);
  });

  it('standard plan allows 2 cases', () => {
    expect(TIER_CASE_LIMITS.standard).toBe(2);
  });

  it('premium plan allows 3 cases', () => {
    expect(TIER_CASE_LIMITS.premium).toBe(3);
  });
});
