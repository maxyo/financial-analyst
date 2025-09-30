import { createCache } from './factory';

export type { ICache, CacheEntry } from './types';
export { MemoryCache } from './memory';

// Singleton cache instance for convenience imports across the codebase.
// Usage:
//   import { cache } from '../lib/cache';
//   await cache.set('key', value, 10_000);
//
// This also allows future backend switch without touching call sites.
let singleton: import('./types').ICache | null = null;

export function getCache(): import('./types').ICache {
  if (!singleton) {
    singleton = createCache();
  }
  return singleton;
}

export const cache = getCache();
