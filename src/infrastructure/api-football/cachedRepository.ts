/**
 * Cache-first, budget-guarded decorator around the API-Football repository
 * (design D5). TTL windows: teams 24h, fixtures+results 15min. The daily
 * budget guard fails fast before any upstream call once it is nearly spent.
 */
import { withCacheFirst } from '../cache/cacheFirst'
import { withBudgetGuard, type DailyBudget } from '../cache/dailyBudget'
import type { TtlCache } from '../cache/ttlCache'
import type { FootballDataRepository } from './repositories'

const TEAMS_TTL_MS = 24 * 60 * 60 * 1000
const FIXTURES_TTL_MS = 15 * 60 * 1000

export function createCachedFootballRepository(
  source: FootballDataRepository,
  cache: TtlCache,
  budget: DailyBudget,
): FootballDataRepository {
  return {
    getTeams() {
      return withCacheFirst({
        cache,
        key: 'teams',
        ttlMs: TEAMS_TTL_MS,
        fetch: withBudgetGuard(budget, () => source.getTeams()),
      })()
    },
    getNextAndRecent(teamId) {
      return withCacheFirst({
        cache,
        key: `fixtures:${teamId}`,
        ttlMs: FIXTURES_TTL_MS,
        fetch: withBudgetGuard(budget, () => source.getNextAndRecent(teamId)),
      })()
    },
  }
}