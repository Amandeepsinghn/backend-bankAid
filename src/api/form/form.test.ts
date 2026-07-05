import { describe, it, expect } from 'vitest';
import { formSubmitSchema, submissionIdParamSchema } from './form.requestHygiene';

describe('Form Request Hygiene', () => {
  const validPayload = {
    bankName: 'Canara Bank',
    branchName: 'MG Road Branch',
    accountNumber: '1234567890',
    remainingBalance: '62240.22',
    freezeDate: '2026-05-01',
    ncrpNo: 'NCRP-2026-001234',
    declaredStuckAmount: 6237.64,
    cityState: 'Bangalore, Karnataka',
    address: '123 MG Road, Bangalore',
    contactNumber: '+919876543210',
    exchangeName: 'Binance',
    orderId: 'ORD-98765',
    counterpartyUsername: 'trader_john',
    exchangeUid: 'UID-12345',
    rbiRegionalOffice: 'RBI Bengaluru',
    emailAddress: 'user@example.com',
  };

  it('validates a complete form payload', () => {
    const result = formSubmitSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects negative stuck amount', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      declaredStuckAmount: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      emailAddress: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = formSubmitSchema.safeParse({
      bankName: 'Canara Bank',
    });
    expect(result.success).toBe(false);
  });

  it('rejects contactNumber without E.164 format', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      contactNumber: '9876543210',
    });
    expect(result.success).toBe(false);
  });

  it('rejects remainingBalance with non-numeric content', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      remainingBalance: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });

  it('rejects remainingBalance with more than 2 decimal places', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      remainingBalance: '100.123',
    });
    expect(result.success).toBe(false);
  });

  it('accepts remainingBalance as a whole number', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      remainingBalance: '50000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid calendar date for freezeDate', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      freezeDate: '2026-13-45',
    });
    expect(result.success).toBe(false);
  });

  it('rejects freezeDate in wrong format', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      freezeDate: '01-05-2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects bankName over 200 characters', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      bankName: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects address over 500 characters', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      address: 'A'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects accountNumber with non-alphanumeric characters', () => {
    const result = formSubmitSchema.safeParse({
      ...validPayload,
      accountNumber: '1234-5678-90',
    });
    expect(result.success).toBe(false);
  });
});

describe('submissionIdParamSchema', () => {
  it('validates UUID', () => {
    const result = submissionIdParamSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID', () => {
    const result = submissionIdParamSchema.safeParse({
      id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});
