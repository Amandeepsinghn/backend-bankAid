import { z } from 'zod';

export const submissionIdParamSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
});

export const letterIdParamSchema = z.object({
  id: z.string().uuid('Invalid letter status ID'),
});

export const markSentSchema = z.object({
  recipientEmail: z.string().email('Invalid email').max(254).optional(),
});
