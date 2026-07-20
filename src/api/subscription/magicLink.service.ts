import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { sendEmail } from '../../config/zeptomail';
import { renderMagicLinkEmail } from '../../lib/magicLinkEmailTemplate';
import { AppError } from '../../middleware/error/errorHandler';
import * as authDb from '../auth/auth.db';
import * as magicLinkDb from './magicLink.db';
import type { CheckoutTokenClaims } from '../../middleware/security/verifyCheckoutToken';

// DEFAULT — flagged for override: how long an emailed link stays valid before expiring.
const MAGIC_LINK_EXPIRY_MINUTES = 20;

// DEFAULT — flagged for override: how long the website's post-verify checkout session
// lasts. Intentionally independent of the link's own remaining lifetime at click-time —
// a user who opens the link at minute 19 of 20 still gets a full checkout window.
const CHECKOUT_CONTEXT_TTL = '30m';

function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Deliberately duplicated from auth.service.ts's private hashToken rather than
// exporting/importing it — keeps magic-link infra fully independent of the auth
// module, per the Part 1 audit decision.
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requestMagicLink(userId: string, ipAddress?: string, userAgent?: string) {
  const profile = await authDb.findProfileById(userId);
  if (!profile) {
    throw new AppError(404, 'Profile not found');
  }

  // Only one live link per user at a time — requesting a new one retires the old.
  await magicLinkDb.invalidatePendingMagicLinkTokens(userId);

  const rawToken = generateRawToken();
  await magicLinkDb.createMagicLinkToken({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000),
    ipAddress,
    userAgent,
  });

  // /checkout/start is a Route Handler on the website that verifies the token
  // server-side and sets an httpOnly session cookie before redirecting to /checkout —
  // the checkout token itself never touches client-side JS.
  const checkoutUrl = `${env.WEBSITE_URL}/checkout/start?token=${rawToken}`;
  await sendEmail(
    { address: profile.email },
    'Continue to payment — Unfreeze',
    renderMagicLinkEmail({ checkoutUrl, expiryMinutes: MAGIC_LINK_EXPIRY_MINUTES }),
  );

  return { message: 'A payment link has been sent to your registered email' };
}

export async function verifyMagicLink(rawToken: string) {
  const claimed = await magicLinkDb.claimMagicLinkTokenByHash(hashToken(rawToken));
  if (!claimed) {
    throw new AppError(400, 'This link is invalid, expired, or has already been used');
  }

  const profile = await authDb.findProfileById(claimed.userId);
  if (!profile) {
    throw new AppError(404, 'Profile not found for this link');
  }

  const claims: CheckoutTokenClaims = {
    userId: profile.id,
    email: profile.email,
    magicLinkTokenId: claimed.id,
    type: 'checkout',
  };
  const checkoutToken = jwt.sign(claims, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: CHECKOUT_CONTEXT_TTL,
  } as SignOptions);

  return {
    checkoutToken,
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
    },
  };
}
