import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncRouter';
import { verifyToken } from '../../middleware/security/verifyToken';
import { requireSubscription } from '../../middleware/security/requireSubscription';
import {
  listCasesController,
  getCaseDetailController,
  getHomeSummaryController,
} from './case.routeController';

const router = Router();

/**
 * @swagger
 * /api/case/home-summary:
 *   get:
 *     tags: [Case]
 *     summary: Get home screen summary
 *     description: Returns subscription status with case usage (used/limit/remaining), total and completed case counts, and the 5 most recent cases with letter progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     tier:
 *                       type: string
 *                       enum: [basic, standard, premium]
 *                     casesUsed:
 *                       type: number
 *                     caseLimit:
 *                       type: number
 *                     casesRemaining:
 *                       type: number
 *                 totalCases:
 *                   type: number
 *                 completedCases:
 *                   type: number
 *                 recentCases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CaseSummary'
 *       401:
 *         description: Unauthorized
 */
router.get('/home-summary', verifyToken, requireSubscription, asyncHandler(getHomeSummaryController));

/**
 * @swagger
 * /api/case:
 *   get:
 *     tags: [Case]
 *     summary: List all cases
 *     description: Returns all cases filed by the user with letter sent/total counts and completion status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CaseSummary'
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, requireSubscription, asyncHandler(listCasesController));

/**
 * @swagger
 * /api/case/{id}:
 *   get:
 *     tags: [Case]
 *     summary: Get case detail with letter previews
 *     description: Returns full case data including all 5 generated letter bodies, subjects, and send status for in-app preview
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
 *         description: Case detail with letter previews
 *       404:
 *         description: Case not found
 */
router.get('/:id', verifyToken, requireSubscription, asyncHandler(getCaseDetailController));

export default router;
