import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(8000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

    DATABASE_URL: z.string().min(1),
    DB_POOL_MAX: z.coerce.number().default(50),

    ZEPTOMAIL_API_KEY: z.string().min(1),
    ZEPTOMAIL_FROM_EMAIL: z.string().email(),
    ZEPTOMAIL_FROM_NAME: z.string().min(1).default('Unfreeze'),
    ZEPTOMAIL_API_URL: z.string().url().default('https://api.zeptomail.in/v1.1/email'),

    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

    REDIS_URL: z.string().min(1).optional(),

    SWAGGER_USER: z.string().min(1).optional(),
    SWAGGER_PASSWORD: z.string().min(1).optional(),

    WEB_CONCURRENCY: z.coerce.number().default(1),

    // Comma-separated list, e.g. "https://yourdomain.com,https://app.yourdomain.com"
    ALLOWED_ORIGINS: z.string().min(1).optional(),

    SENTRY_DSN: z.string().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV !== 'production') return;
    if (!val.RAZORPAY_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RAZORPAY_WEBHOOK_SECRET'],
        message: 'RAZORPAY_WEBHOOK_SECRET is required in production',
      });
    }
    if (!val.ALLOWED_ORIGINS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ALLOWED_ORIGINS'],
        message: 'ALLOWED_ORIGINS is required in production',
      });
    }
  });

export const env = envSchema.parse(process.env);

export const allowedOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : [];
