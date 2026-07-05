import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: false })
  : null;

if (redis) {
  redis.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
  });
}

// Cache helpers fail open — a Redis outage degrades to direct DB reads, never breaks the request.
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore cache write failures
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // ignore cache invalidation failures
  }
}
