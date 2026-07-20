import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncRouter';
import { verifyToken } from '../../middleware/security/verifyToken';
import { magicLinkRequestLimiter } from '../../middleware/security/rateLimit';
import {
  requestMagicLinkController,
  verifyMagicLinkController,
} from './magicLink.routeController';

const router = Router();

/**
 * @swagger
 * /api/subscription/request-magic-link:
 *   post:
 *     tags: [Subscription]
 *     summary: Email the logged-in user a single-use payment link
 *     description: >
 *       Called by the app when a SUBSCRIPTION_REQUIRED error is hit. Invalidates any
 *       prior unused link for this user and emails a fresh one via ZeptoMail.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Link sent
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limited — one request per 2 minutes per user
 */
router.post(
  '/request-magic-link',
  verifyToken,
  magicLinkRequestLimiter,
  asyncHandler(requestMagicLinkController),
);

/**
 * @swagger
 * /api/subscription/magic-link/verify:
 *   get:
 *     tags: [Subscription]
 *     summary: Verify a magic-link token (called server-side by the website, not the app)
 *     description: >
 *       Validates the token (hash lookup, expiry, single-use via atomic claim) and, on
 *       success, mints a short-lived `type: checkout` JWT scoped to this user/email only —
 *       never a full `type: auth` session, so it cannot be used against the rest of the API.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token valid — returns checkoutToken + user identity
 *       400:
 *         description: Invalid, expired, or already-used link
 */
router.get('/magic-link/verify', asyncHandler(verifyMagicLinkController));

export default router;
