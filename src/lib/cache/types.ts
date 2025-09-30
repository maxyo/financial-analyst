export type CacheEntry<T = unknown> = {
  value: T;
  /** Epoch millis when the entry expires; undefined means no expiration */
  expiresAt?: number;
};

export interface ICache {
  /**
   * Get a value by key.
   * Returns undefined if the key is missing or expired.
   */
  get<T = unknown>(key: string): Promise<T | undefined>;

  /**
   * Set a value by key.
   * @param key Cache key
   * @param value Value to store (JSON-serializable recommended)
   * @param ttlMs Optional time to live in milliseconds
   */
  set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void>;

  /** Delete a key (no-op if absent). Returns true if deleted. */
  del(key: string): Promise<boolean>;

  /** Check if key exists and not expired. */
  has(key: string): Promise<boolean>;

  /** Remove all keys. */
  clear(): Promise<void>;

  /** List current keys present (non-expired). */
  keys(): Promise<string[]>;
}
