import { db } from '../../db';
import { profiles, refreshTokens } from '../../db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { AppError } from '../../middleware/error/errorHandler';
import { cacheGet, cacheSet, cacheDel } from '../../lib/redis';

const PROFILE_TTL_SECONDS = 300;

function profileCacheKey(id: string): string {
  return `profile:${id}`;
}

export type ProfileConflictField = 'email' | 'phone';

export class ProfileConflictError extends AppError {
  constructor(public readonly field: ProfileConflictField) {
    super(409, field === 'email' ? 'Email already registered' : 'Phone number already registered');
  }
}

export async function createProfile(data: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  try {
    const [profile] = await db.insert(profiles).values(data).returning();
    return profile!;
  } catch (err) {
    const cause = (err as { cause?: unknown }).cause ?? err;
    const pgError = cause as { code?: string; constraint_name?: string };
    if (pgError.code === '23505') {
      if (pgError.constraint_name?.includes('phone')) {
        throw new ProfileConflictError('phone');
      }
      throw new ProfileConflictError('email');
    }
    throw err;
  }
}

export async function findProfileByEmail(email: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
  return profile;
}

export async function findProfileByPhone(phone: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.phone, phone)).limit(1);
  return profile;
}

export async function findProfileById(id: string) {
  const cacheKey = profileCacheKey(id);
  const cached = await cacheGet<typeof profiles.$inferSelect>(cacheKey);
  if (cached) return cached;

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (profile) {
    await cacheSet(cacheKey, profile, PROFILE_TTL_SECONDS);
  }
  return profile;
}

export async function markEmailVerified(email: string) {
  const [updated] = await db
    .update(profiles)
    .set({ emailVerified: true })
    .where(eq(profiles.email, email))
    .returning();
  if (updated) {
    await cacheDel(profileCacheKey(updated.id));
  }
  return updated;
}

export async function updatePassword(userId: string, hashedPassword: string) {
  const [updated] = await db
    .update(profiles)
    .set({ password: hashedPassword })
    .where(eq(profiles.id, userId))
    .returning();
  if (updated) {
    await cacheDel(profileCacheKey(updated.id));
  }
  return updated;
}

export async function createRefreshToken(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const [token] = await db.insert(refreshTokens).values(data).returning();
  return token!;
}

export async function findActiveRefreshTokenByHash(tokenHash: string) {
  const [token] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return token;
}

export async function revokeRefreshToken(id: string) {
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id));
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}
