import { db } from '../../db';
import { subscriptions } from '../../db/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
import type { Tier } from '../../lib/tierValidation';
import { cacheGet, cacheSet, cacheDel } from '../../lib/redis';

const ACTIVE_SUBSCRIPTION_TTL_SECONDS = 60;

function activeSubscriptionCacheKey(userId: string): string {
  return `subscription:active:${userId}`;
}

export async function createSubscription(data: {
  userId: string;
  tier: Tier;
  razorpayOrderId: string;
  amountPaise: number;
}) {
  const [subscription] = await db.insert(subscriptions).values({
    userId: data.userId,
    tier: data.tier,
    razorpayOrderId: data.razorpayOrderId,
    amountPaise: data.amountPaise,
    status: 'pending',
  }).returning();
  await cacheDel(activeSubscriptionCacheKey(data.userId));
  return subscription!;
}

export async function getSubscriptionByOrderId(razorpayOrderId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpayOrderId, razorpayOrderId))
    .limit(1);
  return subscription;
}

export async function markSubscriptionPaidIfPending(
  razorpayOrderId: string,
  razorpayPaymentId: string,
) {
  const [updated] = await db
    .update(subscriptions)
    .set({ status: 'paid', razorpayPaymentId })
    .where(
      and(eq(subscriptions.razorpayOrderId, razorpayOrderId), eq(subscriptions.status, 'pending')),
    )
    .returning();
  if (updated) {
    await cacheDel(activeSubscriptionCacheKey(updated.userId));
  }
  return updated;
}

export async function markSubscriptionFailed(razorpayOrderId: string) {
  const [updated] = await db
    .update(subscriptions)
    .set({ status: 'failed' })
    .where(eq(subscriptions.razorpayOrderId, razorpayOrderId))
    .returning();
  if (updated) {
    await cacheDel(activeSubscriptionCacheKey(updated.userId));
  }
  return updated;
}

export async function getActiveSubscription(userId: string) {
  const cacheKey = activeSubscriptionCacheKey(userId);
  const cached = await cacheGet<typeof subscriptions.$inferSelect>(cacheKey);
  if (cached) return cached;

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'paid')))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (subscription) {
    await cacheSet(cacheKey, subscription, ACTIVE_SUBSCRIPTION_TTL_SECONDS);
  }
  return subscription;
}

export async function getUserSubscriptions(userId: string) {
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
}

export async function deleteStalePendingSubscriptions(createdBefore: Date) {
  return db
    .delete(subscriptions)
    .where(and(eq(subscriptions.status, 'pending'), lt(subscriptions.createdAt, createdBefore)))
    .returning({ id: subscriptions.id });
}
