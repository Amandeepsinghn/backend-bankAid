import { db } from '../../db';
import { magicLinkTokens } from '../../db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';

export async function createMagicLinkToken(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) {
  const [token] = await db.insert(magicLinkTokens).values(data).returning();
  return token!;
}

// Invalidates any still-unused token for this user by expiring it immediately —
// mirrors auth.otp.db.ts's invalidatePendingOtps, so only the freshly issued link works.
export async function invalidatePendingMagicLinkTokens(userId: string) {
  await db
    .update(magicLinkTokens)
    .set({ expiresAt: new Date() })
    .where(and(eq(magicLinkTokens.userId, userId), isNull(magicLinkTokens.usedAt)));
}

// Atomic claim: only the first caller to hit this for a given token wins the row
// (mirrors subscription.db.ts's markSubscriptionPaidIfPending pending->paid guard),
// making a link opened twice/in two tabs safe — the second caller gets `undefined`.
// Expiry is checked in this same query (not just beforehand) so an expired-but-unused
// token can never get marked used_at by a late request.
export async function claimMagicLinkTokenByHash(tokenHash: string) {
  const [claimed] = await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        isNull(magicLinkTokens.usedAt),
        gt(magicLinkTokens.expiresAt, new Date()),
      ),
    )
    .returning();
  return claimed;
}
