import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncRouter';
import { verifyCheckoutToken } from '../../middleware/security/verifyCheckoutToken';
import { checkoutActionLimiter } from '../../middleware/security/rateLimit';
import {
  checkoutCreateOrderController,
  checkoutVerifyPaymentController,
} from './checkout.routeController';

const router = Router();

/**
 * @swagger
 * /api/subscription/checkout/create-order:
 *   post:
 *     tags: [Subscription]
 *     summary: Create a Razorpay order from a magic-link checkout session
 *     description: >
 *       Same as /create-order, but authenticated via the short-lived `type: checkout` JWT
 *       returned by /magic-link/verify instead of a full app login session. Called by the
 *       website's server-side checkout API route, never directly by the browser.
 *     security:
 *       - checkoutBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tier]
 *             properties:
 *               tier:
 *                 type: string
 *                 enum: [basic, standard, premium]
 *     responses:
 *       201:
 *         description: Order created
 *       401:
 *         description: Invalid or expired checkout session
 */
router.post(
  '/checkout/create-order',
  verifyCheckoutToken,
  checkoutActionLimiter,
  asyncHandler(checkoutCreateOrderController),
);

/**
 * @swagger
 * /api/subscription/checkout/verify-payment:
 *   post:
 *     tags: [Subscription]
 *     summary: Verify a Razorpay payment from a magic-link checkout session
 *     description: Same signature verification as /verify-payment, scoped to the checkout session's user.
 *     security:
 *       - checkoutBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpayOrderId, razorpayPaymentId, razorpaySignature]
 *             properties:
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified
 *       400:
 *         description: Invalid signature
 */
router.post(
  '/checkout/verify-payment',
  verifyCheckoutToken,
  checkoutActionLimiter,
  asyncHandler(checkoutVerifyPaymentController),
);

export default router;
