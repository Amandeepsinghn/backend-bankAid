import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface CheckoutRequest extends Request {
  checkoutUserId?: string;
  checkoutEmail?: string;
  magicLinkTokenId?: string;
}

export interface CheckoutTokenClaims {
  userId: string;
  email: string;
  magicLinkTokenId: string;
  type: 'checkout';
}

// Deliberately separate from verifyToken.ts's `type: 'auth'` check — a checkout-context
// token must never satisfy that middleware, or a website-issued token could be replayed
// against the full authenticated API surface. See Part 1 audit decision.
export function verifyCheckoutToken(req: CheckoutRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1]!;

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as CheckoutTokenClaims;
    if (decoded.type !== 'checkout') {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    req.checkoutUserId = decoded.userId;
    req.checkoutEmail = decoded.email;
    req.magicLinkTokenId = decoded.magicLinkTokenId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
