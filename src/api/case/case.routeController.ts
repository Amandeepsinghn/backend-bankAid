import { Response } from 'express';
import { AuthRequest } from '../../middleware/security/verifyToken';
import * as caseService from './case.service';
import { caseIdParamSchema, paginationQuerySchema } from './case.requestHygiene';

export async function listCasesController(req: AuthRequest, res: Response) {
  const { limit, offset } = paginationQuerySchema.parse(req.query);
  const result = await caseService.listCases(req.userId!, limit, offset);
  res.json(result);
}

export async function getCaseDetailController(req: AuthRequest, res: Response) {
  const { id } = caseIdParamSchema.parse(req.params);
  const result = await caseService.getCaseDetail(id, req.userId!);
  res.json(result);
}

export async function getHomeSummaryController(req: AuthRequest, res: Response) {
  const result = await caseService.getHomeSummary(req.userId!);
  res.json(result);
}
