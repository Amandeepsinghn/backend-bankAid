import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncRouter';
import { verifyToken } from '../../middleware/security/verifyToken';
import { requireSubscription } from '../../middleware/security/requireSubscription';
import {
  getLettersController,
  markSentController,
  getLetterStatusesController,
} from './letter.routeController';

const router = Router();

/**
 * @swagger
 * /api/letter/{submissionId}:
 *   get:
 *     tags: [Letter]
 *     summary: Get all 5 generated letters for a submission
 *     description: Returns the generated letter content with subject, body, and send status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Array of 5 letters with content and status
 *       404:
 *         description: Submission not found
 */
router.get('/:submissionId', verifyToken, requireSubscription, asyncHandler(getLettersController));

/**
 * @swagger
 * /api/letter/{id}/mark-sent:
 *   patch:
 *     tags: [Letter]
 *     summary: Mark a letter as sent
 *     description: Updates the letter status to sent with timestamp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The letter_status ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 description: Optional recipient email to store
 *     responses:
 *       200:
 *         description: Letter marked as sent
 *       404:
 *         description: Letter not found
 */
router.patch('/:id/mark-sent', verifyToken, requireSubscription, asyncHandler(markSentController));

/**
 * @swagger
 * /api/letter/status/{submissionId}:
 *   get:
 *     tags: [Letter]
 *     summary: Get letter send statuses for a submission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Letter statuses
 *       404:
 *         description: Submission not found
 */
router.get('/status/:submissionId', verifyToken, requireSubscription, asyncHandler(getLetterStatusesController));

export default router;
