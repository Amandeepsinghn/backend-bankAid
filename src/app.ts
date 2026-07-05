import express from 'express';
import swaggerUi from 'swagger-ui-express';
import basicAuth from 'express-basic-auth';
import { corsMiddleware } from './middleware/security/cors';
import { helmetMiddleware } from './middleware/security/helmet';
import { requestLogger } from './middleware/logging/morgan';
import { errorHandler } from './middleware/error/errorHandler';
import { logger } from './lib/logger';
import { generalApiLimiter } from './middleware/security/rateLimit';
import { swaggerSpec } from './swagger';
import { env } from './config/env';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { ZodError } from 'zod';
import { asyncHandler } from './lib/asyncRouter';
import { webhookController } from './api/subscription/subscription.routeController';

import authRoutes from './api/auth/auth.route';
import subscriptionRoutes from './api/subscription/subscription.route';
import formRoutes from './api/form/form.route';
import letterRoutes from './api/letter/letter.route';
import caseRoutes from './api/case/case.route';

const app = express();

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(requestLogger);
app.use(generalApiLimiter);

// Mounted before express.json() — Razorpay webhook signature verification needs the raw body bytes.
app.post(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(webhookController),
);

app.use(express.json());

const swaggerGuard: express.RequestHandler =
  env.NODE_ENV === 'production'
    ? env.SWAGGER_USER && env.SWAGGER_PASSWORD
      ? basicAuth({
          users: { [env.SWAGGER_USER]: env.SWAGGER_PASSWORD },
          challenge: true,
        })
      : (_req, res) => {
          res.status(404).end();
        }
    : (_req, _res, next) => next();

app.use('/api-docs', swaggerGuard, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', swaggerGuard, (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/form', formRoutes);
app.use('/api/letter', letterRoutes);
app.use('/api/case', caseRoutes);

app.get('/health', async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unavailable', timestamp: new Date().toISOString() });
  }
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ZodError) {
    const userId = (req as express.Request & { userId?: string }).userId;
    logger.warn(
      { path: req.path, method: req.method, ip: req.ip, userId, errors: err.errors },
      'Input validation failure',
    );
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }
  errorHandler(err, req, res, next);
});

export default app;
