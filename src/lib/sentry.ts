import * as Sentry from '@sentry/node';
import { env } from '../config/env';

// No-op if SENTRY_DSN is unset (e.g. local dev) — Sentry.captureException calls elsewhere stay safe to call unconditionally.
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
