/**
 * Minimal TTL cache. Entries expire from the reader's perspective: `get`
 * returns undefined once `expiresAt` passes, and the expired entry is pruned.
 * Methods are typed per call so one cache instance can hold heterogeneous
 * values under different keys.
 */
export interface TtlCache {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T, ttlMs: number): void
}

export function createTtlCache(now: () => number = Date.now): TtlCache {
  const entries = new Map<string, { value: unknown; expiresAt: number }>()

  return {
    get<T>(key: string): T | undefined {
      const entry = entries.get(key)
      if (entry === undefined) return undefined
      if (entry.expiresAt <= now()) {
        entries.delete(key)
        return undefined
      }
      return entry.value as T
    },
    set<T>(key: string, value: T, ttlMs: number): void {
      entries.set(key, { value, expiresAt: now() + ttlMs })
    },
  }
}