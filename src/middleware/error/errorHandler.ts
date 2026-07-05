import { Request, Response, NextFunction } from 'express';
import { logger } from '../../lib/logger';
import { Sentry } from '../../lib/sentry';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Extend Request locally to avoid a cross-package import cycle
interface AuthenticatedRequest extends Request {
  userId?: string;
}

const REDACTED_KEYS = new Set([
  'password',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'resetToken',
  'authorization',
  'cookie',
]);

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return out;
}

export function errorHandler(
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
) {
  const userId = req.userId;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      // Intentional 5xx AppErrors must not leak internal detail to the client
      Sentry.captureException(err, { extra: { path: req.path, method: req.method, userId } });
      logger.error(
        { err, path: req.path, method: req.method, userId },
        'Application error (5xx)',
      );
        res.status(err.statusCode).json({ error: 'Something went wrong' });
      return;
    }
    // 4xx client errors — message is intentionally user-facing; no server log needed
    // (Morgan access log already records these)
    res.status(err.statusCode).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
    return;
  }

  // Unhandled errors: always log full context and report to Sentry
  const sanitizedBody = sanitizeBody(req.body);
  Sentry.captureException(err, {
    extra: { path: req.path, method: req.method, userId, body: sanitizedBody },
  });
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      userId,
      body: sanitizedBody,
    },
    'Unhandled error',
  );
  res.status(500).json({ error: 'Something went wrong' });
}
