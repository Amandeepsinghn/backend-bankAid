import rateLimit, { ipKeyGenerator, type Options, type AugmentedRequest } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { redis } from '../../lib/redis';
import type { AuthRequest } from './verifyToken';
import type { CheckoutRequest } from './verifyCheckoutToken';

function retryAfterHandler(message: string): NonNullable<Options['handler']> {
  return (req, res, _next, options) => {
    const info = (req as AugmentedRequest)['rateLimit'];
    const retryAfter = info?.resetTime
      ? Math.ceil((info.resetTime.getTime() - Date.now()) / 1000)
      : Math.ceil(options.windowMs / 1000);
    res.set('Retry-After', String(Math.max(1, retryAfter)));
    res.status(429).json({ error: message });
  };
}

// Shares counters across clustered workers/instances via Redis. Without this, each
// worker forked by WEB_CONCURRENCY (see server.ts) tracks its own counters, so a
// client can get up to WEB_CONCURRENCY times the intended limit — and counts reset
// on every deploy/restart. Falls back to express-rate-limit's in-memory store if
// Redis isn't configured (matches the fail-open pattern used in lib/redis.ts).
function makeStore(prefix: string): Options['store'] | undefined {
  const client = redis;
  if (!client) return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => client.call(args[0]!, ...args.slice(1)) as Promise<RedisReply>,
  }) as unknown as Options['store'];
}

// Applied globally in app.ts — 60 requests per minute per IP
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:general:'),
  handler: retryAfterHandler('Too many requests, please try again later'),
});

// Login, register, reset-password — 5 requests per 15 minutes per IP
export const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:auth:'),
  handler: retryAfterHandler('Too many attempts, please try again later'),
});

// OTP send endpoints (register, forgot-password) — 5 per 15 minutes per IP
export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:otp-req:'),
  handler: retryAfterHandler('Too many OTP requests, please try again later'),
});

// OTP verification attempts (verify-phone, verify-reset-otp) — 10 per 15 minutes per IP
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:otp-verify:'),
  handler: retryAfterHandler('Too many verification attempts, please try again later'),
});

// Payment actions (create-order, verify-payment) — 10 per 15 minutes per user.
// Runs after verifyToken, so req.userId is always set; keying by user (not IP)
// avoids one user's retries locking out others behind the same NAT/carrier IP.
export const paymentActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:payment:'),
  keyGenerator: (req) => (req as AuthRequest).userId ?? ipKeyGenerator(req.ip!),
  handler: retryAfterHandler('Too many payment requests, please try again later'),
});

// Checkout actions (checkout/create-order, checkout/verify-payment) — 10 per 15 minutes
// per checkout-session user. Deliberately keyed on `checkoutUserId`, never falling back to
// IP: these calls arrive server-to-server from the website's own backend, so req.ip would
// be the website server's IP — one shared bucket across every user checking out through it.
export const checkoutActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:checkout:'),
  keyGenerator: (req) => (req as CheckoutRequest).checkoutUserId!,
  handler: retryAfterHandler('Too many payment requests, please try again later'),
});

// Magic-link requests (request-magic-link) — 1 per 2 minutes per user. Own bucket,
// deliberately not shared with otpRequestLimiter: a burst of login-OTP requests must
// never exhaust a user's magic-link quota, or vice versa (see Part 1 audit decision).
export const magicLinkRequestLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:magic-link:'),
  keyGenerator: (req) => (req as AuthRequest).userId ?? ipKeyGenerator(req.ip!),
  handler: retryAfterHandler('Please wait before requesting another link'),
});
