import { Response } from 'express';
import { AuthRequest } from '../../middleware/security/verifyToken';
import * as formService from './form.service';
import { formSubmitSchema, submissionIdParamSchema, paginationQuerySchema } from './form.requestHygiene';

export async function submitFormController(req: AuthRequest, res: Response) {
  const data = formSubmitSchema.parse(req.body);
  const result = await formService.submitForm(req.userId!, data);
  res.status(201).json(result);
}

export async function getSubmissionsController(req: AuthRequest, res: Response) {
  const { limit, offset } = paginationQuerySchema.parse(req.query);
  const result = await formService.getSubmissions(req.userId!, limit, offset);
  res.json(result);
}

export async function getSubmissionByIdController(req: AuthRequest, res: Response) {
  const { id } = submissionIdParamSchema.parse(req.params);
  const result = await formService.getSubmissionById(id, req.userId!);
  res.json(result);
}
