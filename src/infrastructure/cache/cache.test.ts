import { describe, expect, it } from 'vitest'
import { ApiRateLimitError } from '../../domain/errors'
import type { Team } from '../../domain/football/model'
import { createCachedFootballRepository } from '../api-football/cachedRepository'
import type { FootballDataRepository } from '../api-football/repositories'
import { withCacheFirst } from './cacheFirst'
import { createDailyBudget, withBudgetGuard } from './dailyBudget'
import { createTtlCache } from './ttlCache'

describe('createTtlCache', () => {
  it('serves a fresh entry inside its TTL window', () => {
    const cache = createTtlCache(() => 1_000)
    cache.set('teams', 42, 100)
    expect(cache.get<number>('teams')).toBe(42)
  })

  it('returns undefined once the entry expires', () => {
    let clock = 0
    const cache = createTtlCache(() => clock)
    cache.set('teams', 42, 100)
    clock = 101
    expect(cache.get<number>('teams')).toBeUndefined()
  })

  it('returns undefined for an unknown key', () => {
    const cache = createTtlCache()
    expect(cache.get<number>('missing')).toBeUndefined()
  })

  it('keeps entries under different keys independent', () => {
    const cache = createTtlCache(() => 0)
    cache.set('a', 1, 100)
    cache.set('b', 2, 100)
    expect(cache.get<number>('a')).toBe(1)
    expect(cache.get<number>('b')).toBe(2)
  })
})

describe('withCacheFirst', () => {
  it('serves fresh data from the cache without calling fetch again', async () => {
    const cache = createTtlCache()
    let calls = 0
    const read = withCacheFirst({
      cache,
      key: 'teams',
      ttlMs: 1_000,
      fetch: async () => {
        calls += 1
        return 'payload'
      },
    })
    await read()
    await read()
    expect(calls).toBe(1)
  })

  it('re-fetches once the cached entry is stale', async () => {
    let clock = 0
    const cache = createTtlCache(() => clock)
    let calls = 0
    const read = withCacheFirst({
      cache,
      key: 'teams',
      ttlMs: 100,
      fetch: async () => {
        calls += 1
        return `payload-${calls}`
      },
    })
    expect(await read()).toBe('payload-1')
    clock = 101
    expect(await read()).toBe('payload-2')
    expect(calls).toBe(2)
  })
})

describe('createDailyBudget', () => {
  it('counts down the remaining budget as calls are consumed', () => {
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 10 })
    budget.consume()
    budget.consume()
    expect(budget.remaining()).toBe(8)
  })

  it('fails fast with ApiRateLimitError when fewer than 5 calls remain', () => {
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 10 })
    for (let i = 0; i < 6; i += 1) budget.consume()
    expect(budget.remaining()).toBe(4)
    expect(() => budget.assertAvailable()).toThrow(ApiRateLimitError)
  })

  it('allows a call while 5 calls remain', () => {
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 10 })
    for (let i = 0; i < 5; i += 1) budget.consume()
    expect(() => budget.assertAvailable()).not.toThrow()
  })

  it('resets the counter on a new day', () => {
    let today = new Date('2026-08-06T10:00:00Z')
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 10, now: () => today })
    for (let i = 0; i < 6; i += 1) budget.consume()
    today = new Date('2026-08-07T10:00:00Z')
    expect(budget.remaining()).toBe(10)
  })
})

describe('withBudgetGuard', () => {
  it('skips the upstream call when the budget is exhausted', async () => {
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 10 })
    let calls = 0
    const guarded = withBudgetGuard(budget, async () => {
      calls += 1
      return 'ok'
    })
    for (let i = 0; i < 6; i += 1) budget.consume()
    await expect(guarded()).rejects.toThrow(ApiRateLimitError)
    expect(calls).toBe(0)
  })

  it('consumes the budget after a successful upstream call', async () => {
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 10 })
    await withBudgetGuard(budget, async () => 'ok')()
    expect(budget.remaining()).toBe(9)
  })
})

describe('createCachedFootballRepository', () => {
  const teams: Team[] = [{ id: '1', name: 'Atlético Nacional', crestUrl: 'https://c.com/an.png' }]

  function sourceWithCounter(counter: { value: number }): FootballDataRepository {
    return {
      getTeams: async () => {
        counter.value += 1
        return teams
      },
      getNextAndRecent: async (teamId: string) => {
        counter.value += 1
        return {
          next: { id: teamId, home: 'B', away: 'A', kickoffUtc: '2026-08-16T22:00:00Z', status: 'SCHEDULED' },
          results: [],
        }
      },
    }
  }

  it('serves a cached teams list without consuming budget or fetching again', async () => {
    const counter = { value: 0 }
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 100 })
    const repo = createCachedFootballRepository(sourceWithCounter(counter), createTtlCache(), budget)
    expect(await repo.getTeams()).toEqual(teams)
    expect(await repo.getTeams()).toEqual(teams)
    expect(counter.value).toBe(1)
    expect(budget.remaining()).toBe(99)
  })

  it('fails fast with ApiRateLimitError when the budget is exhausted', async () => {
    const counter = { value: 0 }
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 10 })
    for (let i = 0; i < 6; i += 1) budget.consume()
    const repo = createCachedFootballRepository(sourceWithCounter(counter), createTtlCache(), budget)
    await expect(repo.getTeams()).rejects.toThrow(ApiRateLimitError)
    expect(counter.value).toBe(0)
  })

  it('re-fetches and consumes budget once the cached fixtures are stale', async () => {
    let clock = 0
    const counter = { value: 0 }
    const budget = createDailyBudget({ storage: memoryStorage(), maxPerDay: 100 })
    const repo = createCachedFootballRepository(sourceWithCounter(counter), createTtlCache(() => clock), budget)
    expect((await repo.getNextAndRecent('9')).next?.id).toBe('9')
    expect((await repo.getNextAndRecent('9')).next?.id).toBe('9')
    expect(counter.value).toBe(1)
    clock = 15 * 60 * 1000 + 1
    expect((await repo.getNextAndRecent('9')).next?.id).toBe('9')
    expect(counter.value).toBe(2)
    expect(budget.remaining()).toBe(98)
  })
})

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  }
}