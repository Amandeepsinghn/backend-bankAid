import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncRouter';
import { verifyToken } from '../../middleware/security/verifyToken';
import { requireSubscription } from '../../middleware/security/requireSubscription';
import {
  submitFormController,
  getSubmissionsController,
  getSubmissionByIdController,
} from './form.routeController';

const router = Router();

/**
 * @swagger
 * /api/form/submit:
 *   post:
 *     tags: [Form]
 *     summary: Submit the case form
 *     description: Submits form data, validates tier against stuck amount, creates 5 letter_status rows
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankName
 *               - branchName
 *               - accountNumber
 *               - remainingBalance
 *               - freezeDate
 *               - ncrpNo
 *               - declaredStuckAmount
 *               - cityState
 *               - address
 *               - contactNumber
 *               - exchangeName
 *               - orderId
 *               - counterpartyUsername
 *               - exchangeUid
 *               - rbiRegionalOffice
 *               - emailAddress
 *             properties:
 *               bankName:
 *                 type: string
 *                 example: Canara Bank
 *               branchName:
 *                 type: string
 *                 example: MG Road Branch
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               remainingBalance:
 *                 type: string
 *                 example: "62240.22"
 *               freezeDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-01"
 *               ncrpNo:
 *                 type: string
 *                 example: NCRP-2026-001234
 *               declaredStuckAmount:
 *                 type: number
 *                 example: 6237.64
 *               cityState:
 *                 type: string
 *                 example: Bangalore, Karnataka
 *               address:
 *                 type: string
 *                 example: 123 MG Road, Bangalore
 *               contactNumber:
 *                 type: string
 *                 example: "+919876543210"
 *               exchangeName:
 *                 type: string
 *                 example: Binance
 *               orderId:
 *                 type: string
 *                 example: ORD-98765
 *               counterpartyUsername:
 *                 type: string
 *                 example: trader_john
 *               exchangeUid:
 *                 type: string
 *                 example: UID-12345
 *               rbiRegionalOffice:
 *                 type: string
 *                 example: RBI Bengaluru
 *               emailAddress:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       201:
 *         description: Form submitted, letters created
 *       400:
 *         description: Stuck amount exceeds tier range
 *       403:
 *         description: No active subscription
 */
router.post('/submit', verifyToken, requireSubscription, asyncHandler(submitFormController));

/**
 * @swagger
 * /api/form/submissions:
 *   get:
 *     tags: [Form]
 *     summary: Get all submissions for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of form submissions
 *       401:
 *         description: Unauthorized
 */
router.get('/submissions', verifyToken, asyncHandler(getSubmissionsController));

/**
 * @swagger
 * /api/form/submissions/{id}:
 *   get:
 *     tags: [Form]
 *     summary: Get a specific submission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission details
 *       404:
 *         description: Submission not found
 */
router.get('/submissions/:id', verifyToken, asyncHandler(getSubmissionByIdController));

export default router;
