/**
 * Shared Redis connection for BullMQ.
 * Reuses a single connection across all queues and workers.
 */

import { Redis } from 'ioredis';

let _redis: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    _redis = new Redis(url, {
      maxRetriesPerRequest: null,   // required by BullMQ
      enableReadyCheck: false,
    });

    _redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });
  }
  return _redis;
}
