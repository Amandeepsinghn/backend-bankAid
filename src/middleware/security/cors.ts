import cors from 'cors';
import { env, allowedOrigins } from '../../config/env';

// Production requires an explicit allowlist (enforced by env.ts); dev/test stay permissive for local tooling.
export const corsMiddleware = cors({
  origin: env.NODE_ENV === 'production' ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
