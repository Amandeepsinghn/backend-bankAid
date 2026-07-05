import { Response } from 'express';
import { AuthRequest } from '../../middleware/security/verifyToken';
import * as letterService from './letter.service';
import {
  submissionIdParamSchema,
  letterIdParamSchema,
  markSentSchema,
} from './letter.requestHygiene';

export async function getLettersController(req: AuthRequest, res: Response) {
  const { submissionId } = submissionIdParamSchema.parse(req.params);
  const result = await letterService.getLettersForSubmission(submissionId, req.userId!);
  res.json(result);
}

export async function markSentController(req: AuthRequest, res: Response) {
  const { id } = letterIdParamSchema.parse(req.params);
  const data = markSentSchema.parse(req.body);
  const result = await letterService.markLetterAsSent(id, req.userId!, data.recipientEmail);
  res.json(result);
}

export async function getLetterStatusesController(req: AuthRequest, res: Response) {
  const { submissionId } = submissionIdParamSchema.parse(req.params);
  const result = await letterService.getLetterStatuses(submissionId, req.userId!);
  res.json(result);
}
