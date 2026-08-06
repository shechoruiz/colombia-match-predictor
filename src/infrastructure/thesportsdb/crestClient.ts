/**
 * TheSportsDB crest lookup (best-effort enhancement on top of the primary
 * API-Football catalog). Uses the public test key `3` by default; falls back to
 * a placeholder when the team is unknown or the service is unreachable, but
 * fails fast with a typed error when the payload violates the contract.
 * Crests are cached 30 days (design D5).
 */
import { z } from 'zod'
import { ValidationError } from '../../domain/errors'
import { withCacheFirst } from '../cache/cacheFirst'
import { createTtlCache, type TtlCache } from '../cache/ttlCache'
import type { ApiConfig } from '../config'

const CREST_TTL_MS = 30 * 24 * 60 * 60 * 1000
const DEFAULT_TEST_KEY = '3'

export const PLACEHOLDER_CREST_URL = 'https://placehold.co/96x96?text=?'

const crestSearchSchema = z.object({
  teams: z.array(z.object({ strTeamBadge: z.string() })).nullable(),
})

export interface CrestClient {
  getCrest(teamName: string): Promise<string>
}

export function createCrestClient(config: ApiConfig, cache: TtlCache = createTtlCache()): CrestClient {
  const key = config.theSportsDbKey ?? DEFAULT_TEST_KEY

  async function lookup(teamName: string): Promise<string> {
    const url = `https://www.thesportsdb.com/api/v1/json/${key}/searchteams.php?t=${encodeURIComponent(teamName)}`
    let response: Response
    try {
      response = await fetch(url)
    } catch {
      return PLACEHOLDER_CREST_URL
    }
    if (!response.ok) return PLACEHOLDER_CREST_URL
    const parsed = crestSearchSchema.safeParse(await response.json())
    if (!parsed.success) {
      throw new ValidationError(`thesportsdb: invalid crest payload for ${teamName}`)
    }
    return parsed.data.teams?.[0]?.strTeamBadge ?? PLACEHOLDER_CREST_URL
  }

  return {
    getCrest(teamName: string): Promise<string> {
      const cacheKey = `crest:${teamName.toLowerCase()}`
      return withCacheFirst({ cache, key: cacheKey, ttlMs: CREST_TTL_MS, fetch: () => lookup(teamName) })()
    },
  }
}