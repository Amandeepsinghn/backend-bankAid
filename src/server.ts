import cluster from 'cluster';
import os from 'os';
import { env } from './config/env';
import { logger } from './lib/logger';
import { Sentry } from './lib/sentry';

// Belt-and-suspenders: catch anything that escapes asyncHandler
function crashWith(err: Error, message: string) {
  Sentry.captureException(err);
  logger.fatal({ err }, message);
  // Sentry sends events over HTTP; flush (bounded) before exiting so a fatal crash isn't silently dropped.
  Sentry.close(2000).finally(() => process.exit(1));
}

process.on('uncaughtException', (err) => {
  crashWith(err, 'Uncaught exception');
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  crashWith(err, 'Unhandled promise rejection');
});

async function startServer() {
  const { default: app } = await import('./app');
  const { client } = await import('./db');
  const { startCleanupJob } = await import('./lib/cleanupJob');
  const { startPendingSubscriptionCleanupJob } = await import('./lib/pendingSubscriptionCleanupJob');
  const { redis } = await import('./lib/redis');

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} (pid ${process.pid})`);
    logger.info(`Swagger docs: http://localhost:${env.PORT}/api-docs`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  // Only one worker owns the periodic cleanup jobs to avoid duplicate deletes across the fleet.
  const ownsCleanupJob = !cluster.isWorker || cluster.worker?.id === 1;
  const cleanupHandle = ownsCleanupJob ? startCleanupJob() : null;
  const pendingSubscriptionCleanupHandle = ownsCleanupJob
    ? startPendingSubscriptionCleanupJob()
    : null;

  function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down (pid ${process.pid})`);
    if (cleanupHandle) clearInterval(cleanupHandle);
    if (pendingSubscriptionCleanupHandle) clearInterval(pendingSubscriptionCleanupHandle);

    server.close(() => {
      Promise.allSettled([client.end(), redis?.quit()])
        .then(() => {
          logger.info('Shutdown complete');
          process.exit(0);
        })
        .catch(() => process.exit(1));
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (env.WEB_CONCURRENCY > 1 && cluster.isPrimary) {
  const workerCount = Math.min(env.WEB_CONCURRENCY, os.cpus().length);
  logger.info(`Primary ${process.pid} forking ${workerCount} workers`);

  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.error(`Worker ${worker.process.pid} exited (code ${code}, signal ${signal}) — restarting`);
    cluster.fork();
  });

  process.on('SIGTERM', () => {
    for (const worker of Object.values(cluster.workers ?? {})) {
      worker?.process.kill('SIGTERM');
    }
  });
} else {
  startServer();
}
