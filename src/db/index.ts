import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

// DB_POOL_MAX is the total budget across all clustered worker processes on this host.
const perWorkerMax = Math.max(1, Math.floor(env.DB_POOL_MAX / env.WEB_CONCURRENCY));

export const client = postgres(env.DATABASE_URL, {
  max: perWorkerMax,
  idle_timeout: 30,
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });
