import { Response, NextFunction } from 'express';
import { db } from '../../db';
import { subscriptions } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from './verifyToken';

export async function requireSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const activeSubscription = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, req.userId), eq(subscriptions.status, 'paid')))
    .limit(1);

  if (activeSubscription.length === 0) {
    res.status(403).json({ error: 'Active subscription required', code: 'SUBSCRIPTION_REQUIRED' });
    return;
  }

  next();
}
