import { Response } from 'express';
import { AuthRequest } from '../../middleware/security/verifyToken';
import * as magicLinkService from './magicLink.service';
import { verifyMagicLinkQuerySchema } from './magicLink.requestHygiene';

export async function requestMagicLinkController(req: AuthRequest, res: Response) {
  const result = await magicLinkService.requestMagicLink(
    req.userId!,
    req.ip,
    req.headers['user-agent'],
  );
  res.json(result);
}

export async function verifyMagicLinkController(req: AuthRequest, res: Response) {
  const data = verifyMagicLinkQuerySchema.parse(req.query);
  const result = await magicLinkService.verifyMagicLink(data.token);
  res.json(result);
}
