/**
 * Cache-first decorator for repository reads (design D5). Serves fresh data
 * from the TTL cache; on miss/stale it fetches from the source and stores the
 * result. Never re-fetches inside the TTL window — that is what respects the
 * daily request cap.
 */
import type { TtlCache } from './ttlCache'

export interface CacheFirstOptions<T> {
  cache: TtlCache
  key: string
  ttlMs: number
  fetch: () => Promise<T>
}

export function withCacheFirst<T>(options: CacheFirstOptions<T>): () => Promise<T> {
  const { cache, key, ttlMs, fetch } = options
  return async () => {
    const cached = cache.get<T>(key)
    if (cached !== undefined) return cached
    const fresh = await fetch()
    cache.set(key, fresh, ttlMs)
    return fresh
  }
}