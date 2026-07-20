import { z } from 'zod';

export const verifyMagicLinkQuerySchema = z.object({
  token: z.string().min(1, 'Token is required').max(256),
});
