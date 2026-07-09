import { cleanupStalePendingSubscriptions } from '../api/subscription/subscription.service';
import { logger } from './logger';

const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

async function runCleanup(): Promise<void> {
  const deletedCount = await cleanupStalePendingSubscriptions();
  if (deletedCount > 0) {
    logger.info({ deletedCount }, 'Deleted stale pending subscriptions');
  }
}

export function startPendingSubscriptionCleanupJob(): NodeJS.Timeout {
  runCleanup().catch((err) => logger.error({ err }, 'Pending subscription cleanup job failed'));
  return setInterval(() => {
    runCleanup().catch((err) => logger.error({ err }, 'Pending subscription cleanup job failed'));
  }, CLEANUP_INTERVAL_MS);
}
