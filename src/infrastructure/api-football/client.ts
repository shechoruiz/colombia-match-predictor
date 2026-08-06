/**
 * Minimal typed fetch wrapper for the API-Football v3 REST API. Maps transport
 * failures to typed domain errors (guía §13): HTTP 429 → rate limit, any other
 * HTTP error or network failure → ApiError. The key is injected via DI config,
 * never read from `import.meta.env` (which would be a `VITE_` bundle leak).
 */
import { ApiError, ApiRateLimitError, ValidationError } from '../../domain/errors'
import type { ApiConfig } from '../config'

export const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'

export interface ApiFootballClient {
  /** GET `path` with query params; returns the raw (unvalidated) JSON payload. */
  get(path: string, params?: Record<string, string>): Promise<unknown>
}

export function createApiFootballClient(config: ApiConfig): ApiFootballClient {
  if (!config.apiFootballKey) {
    throw new ValidationError('API_FOOTBALL_KEY is required to build the API-Football client')
  }
  const key = config.apiFootballKey

  return {
    async get(path, params = {}) {
      const url = new URL(`${API_FOOTBALL_BASE_URL}${path}`)
      for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value)

      let response: Response
      try {
        response = await fetch(url, {
          headers: { 'x-apisports-key': key },
        })
      } catch {
        throw new ApiError(`API-Football request to ${path} failed`)
      }
      assertSuccessfulHttp(response, path)
      return response.json()
    },
  }
}

function assertSuccessfulHttp(response: Response, path: string): void {
  if (response.ok) return
  if (response.status === 429) {
    throw new ApiRateLimitError('API-Football rate limit reached (HTTP 429)')
  }
  throw new ApiError(`API-Football request to ${path} failed with HTTP ${response.status}`)
}