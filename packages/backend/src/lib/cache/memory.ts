import type { ICache, CacheEntry } from './types';

/**
 * Simple in-memory cache with optional TTL per entry.
 * Not distributed; suitable for single-process usage.
 */
export class MemoryCache implements ICache {
  private store: Map<string, CacheEntry> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly cleanupIntervalMs: number;

  constructor(options?: { cleanupIntervalMs?: number }) {
    this.cleanupIntervalMs = options?.cleanupIntervalMs ?? 30_000; // 30s
    this.startCleanup();
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    const expiresAt = typeof ttlMs === 'number' && ttlMs > 0 ? Date.now() + ttlMs : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(): Promise<string[]> {
    this.cleanupExpired();
    return Array.from(this.store.keys());
  }

  /** Manually stop cleanup timer (useful for tests). */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return typeof entry.expiresAt === 'number' && entry.expiresAt <= Date.now();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (typeof entry.expiresAt === 'number' && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  private startCleanup(): void {
    if (this.cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => this.cleanupExpired(), this.cleanupIntervalMs);
      // Do not keep the process alive due to the timer
      this.cleanupTimer.unref?.();
    }
  }
}
