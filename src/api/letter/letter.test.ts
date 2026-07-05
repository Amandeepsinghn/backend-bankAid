import { describe, it, expect } from 'vitest';
import { generateLetters } from '../../lib/letterTemplates';
import {
  submissionIdParamSchema,
  letterIdParamSchema,
  markSentSchema,
} from './letter.requestHygiene';

describe('Letter Request Hygiene', () => {
  it('validates UUID for submissionId', () => {
    expect(
      submissionIdParamSchema.safeParse({
        submissionId: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
    ).toBe(true);

    expect(
      submissionIdParamSchema.safeParse({ submissionId: 'not-uuid' }).success,
    ).toBe(false);
  });

  it('validates UUID for letter ID', () => {
    expect(
      letterIdParamSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
    ).toBe(true);
  });

  it('allows optional recipientEmail', () => {
    expect(markSentSchema.safeParse({}).success).toBe(true);
    expect(
      markSentSchema.safeParse({ recipientEmail: 'a@b.com' }).success,
    ).toBe(true);
  });
});

describe('Letter Templates', () => {
  const testData = {
    fullName: 'Uttam Yadav',
    bankName: 'Canara Bank',
    branchName: 'MG Road Branch',
    accountNumber: '1234567890',
    remainingBalance: '62240.22',
    freezeDate: '2026-05-01',
    ncrpNo: 'NCRP-2026-001234',
    declaredStuckAmount: '6237.64',
    cityState: 'Bangalore, Karnataka',
    address: '123 MG Road, Bangalore',
    contactNumber: '+919876543210',
    exchangeName: 'Binance',
    orderId: 'ORD-98765',
    counterpartyUsername: 'trader_john',
    exchangeUid: 'UID-12345',
    rbiRegionalOffice: 'RBI Bengaluru',
    emailAddress: 'uttam@example.com',
  };

  it('generates exactly 5 letters', () => {
    const letters = generateLetters(testData);
    expect(letters).toHaveLength(5);
  });

  it('generates all 5 letter types', () => {
    const letters = generateLetters(testData);
    const types = letters.map((l) => l.letterType);
    expect(types).toContain('branch_manager');
    expect(types).toContain('investigating_officer');
    expect(types).toContain('nodal_officer');
    expect(types).toContain('exchange_compliance');
    expect(types).toContain('rbi_ombudsman');
  });

  it('interpolates user data into branch manager letter', () => {
    const letters = generateLetters(testData);
    const branchManager = letters.find((l) => l.letterType === 'branch_manager')!;
    expect(branchManager.body).toContain('Canara Bank');
    expect(branchManager.body).toContain('1234567890');
    expect(branchManager.body).toContain('6237.64');
    expect(branchManager.body).toContain('Uttam Yadav');
  });

  it('interpolates exchange details into exchange compliance letter', () => {
    const letters = generateLetters(testData);
    const exchange = letters.find((l) => l.letterType === 'exchange_compliance')!;
    expect(exchange.body).toContain('Binance');
    expect(exchange.body).toContain('ORD-98765');
    expect(exchange.body).toContain('trader_john');
    expect(exchange.body).toContain('UID-12345');
  });

  it('masks account number in investigating officer letter', () => {
    const letters = generateLetters(testData);
    const io = letters.find((l) => l.letterType === 'investigating_officer')!;
    expect(io.body).toContain('XXX890');
  });
});
