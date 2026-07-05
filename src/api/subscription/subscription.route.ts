import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncRouter';
import { verifyToken } from '../../middleware/security/verifyToken';
import { paymentActionLimiter } from '../../middleware/security/rateLimit';
import {
  getPlansController,
  createOrderController,
  verifyPaymentController,
  getStatusController,
} from './subscription.routeController';

const router = Router();

/**
 * @swagger
 * /api/subscription/plans:
 *   get:
 *     tags: [Subscription]
 *     summary: Get available subscription plans
 *     description: Returns the 3 tier plans with pricing
 *     responses:
 *       200:
 *         description: List of plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tier:
 *                     type: string
 *                     enum: [basic, standard, premium]
 *                   label:
 *                     type: string
 *                   amountRange:
 *                     type: string
 *                   priceDisplay:
 *                     type: string
 *                   pricePaise:
 *                     type: number
 *                   caseLimit:
 *                     type: number
 *                     description: Maximum number of cases allowed for this plan
 */
router.get('/plans', asyncHandler(getPlansController));

/**
 * @swagger
 * /api/subscription/status:
 *   get:
 *     tags: [Subscription]
 *     summary: Check subscription status with case usage
 *     description: Returns active subscription info plus cases used, limit, and remaining
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status with case usage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasActiveSubscription:
 *                   type: boolean
 *                 subscription:
 *                   type: object
 *                   nullable: true
 *                 casesUsed:
 *                   type: number
 *                 caseLimit:
 *                   type: number
 *                 casesRemaining:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/status', verifyToken, asyncHandler(getStatusController));

/**
 * @swagger
 * /api/subscription/create-order:
 *   post:
 *     tags: [Subscription]
 *     summary: Create a Razorpay order
 *     security:
 *       - bearerAuth: []
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
 *                 example: standard
 *     responses:
 *       201:
 *         description: Order created
 *       401:
 *         description: Unauthorized
 */
router.post('/create-order', verifyToken, paymentActionLimiter, asyncHandler(createOrderController));

/**
 * @swagger
 * /api/subscription/verify-payment:
 *   post:
 *     tags: [Subscription]
 *     summary: Verify Razorpay payment
 *     description: Verifies the payment signature and marks subscription as paid
 *     security:
 *       - bearerAuth: []
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
  '/verify-payment',
  verifyToken,
  paymentActionLimiter,
  asyncHandler(verifyPaymentController)
);

export default router;
