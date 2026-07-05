import { z } from 'zod';

export const formSubmitSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required').max(200, 'Bank name too long'),
  branchName: z.string().min(1, 'Branch name is required').max(200, 'Branch name too long'),
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .max(30, 'Account number too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Account number must be alphanumeric'),
  remainingBalance: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Remaining balance must be a valid decimal amount (e.g. 62240.22)'),
  freezeDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Freeze date must be in YYYY-MM-DD format')
    .refine((d) => !isNaN(Date.parse(d)), 'Freeze date is not a valid calendar date'),
  ncrpNo: z.string().min(1, 'NCRP number is required').max(100, 'NCRP number too long'),
  declaredStuckAmount: z.number().positive('Stuck amount must be positive'),
  cityState: z.string().min(1, 'City/State is required').max(200, 'City/State too long'),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
  contactNumber: z
    .string()
    .regex(/^\+\d{10,15}$/, 'Contact number must be in E.164 format (e.g., +919876543210)'),
  exchangeName: z.string().min(1, 'Exchange name is required').max(100, 'Exchange name too long'),
  orderId: z.string().min(1, 'Order ID is required').max(100, 'Order ID too long'),
  counterpartyUsername: z
    .string()
    .min(1, 'Counterparty username is required')
    .max(100, 'Username too long'),
  exchangeUid: z.string().min(1, 'Exchange UID is required').max(100, 'Exchange UID too long'),
  rbiRegionalOffice: z
    .string()
    .min(1, 'RBI regional office is required')
    .max(200, 'RBI regional office name too long'),
  emailAddress: z.string().email('Valid email is required').max(254),
});

export const submissionIdParamSchema = z.object({
  id: z.string().uuid('Invalid submission ID'),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
