import { db } from '../db';
import { otps, refreshTokens } from '../db/schema';
import { lt, or, and, isNotNull } from 'drizzle-orm';
import { logger } from './logger';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function cleanupExpiredAuthRecords(): Promise<void> {
  const now = new Date();
  const refreshTokenCutoff = new Date(now.getTime() - REFRESH_TOKEN_RETENTION_MS);

  await db.delete(otps).where(lt(otps.expiresAt, now));

  await db
    .delete(refreshTokens)
    .where(
      or(
        and(isNotNull(refreshTokens.revokedAt), lt(refreshTokens.revokedAt, refreshTokenCutoff)),
        lt(refreshTokens.expiresAt, refreshTokenCutoff),
      ),
    );
}

export function startCleanupJob(): NodeJS.Timeout {
  cleanupExpiredAuthRecords().catch((err) => logger.error({ err }, 'Cleanup job failed'));
  return setInterval(() => {
    cleanupExpiredAuthRecords().catch((err) => logger.error({ err }, 'Cleanup job failed'));
  }, CLEANUP_INTERVAL_MS);
}
