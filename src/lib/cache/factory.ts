import type { ICache } from './types';
import { MemoryCache } from './memory';

export type CacheBackend = 'memory' | 'redis';

export interface CacheOptions {
  backend?: CacheBackend;
  /**
   * TTL in ms used by helpers if no TTL is specified at call sites.
   * Purely advisory; MemoryCache does not enforce a global default.
   */
  defaultTtlMs?: number;
}

/**
 * Create a cache instance based on environment options.
 *
 * Currently supports only in-memory cache. If backend is set to 'redis',
 * we log a warning and fall back to memory. This makes switching to Redis
 * in the future straightforward without breaking current behavior.
 */
export function createCache(options?: CacheOptions): ICache {
  const backendEnv = (process.env.CACHE_BACKEND || '').trim().toLowerCase();
  const backend: CacheBackend | '' = (options?.backend || backendEnv) as CacheBackend | '';

  if (backend === 'redis') {
    // Future extension point: plug a RedisCache here.
    // Example:
    //   return new RedisCache(redisClient, { defaultTtlMs: options?.defaultTtlMs })
    // For now, warn and fall back to memory.
    // eslint-disable-next-line no-console
    console.warn('[cache] Redis backend selected but not implemented; falling back to memory');
  }

  return new MemoryCache();
}
