import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { ApiError, ApiRateLimitError, ValidationError } from '../../domain/errors'
import { API_FOOTBALL_URL } from '../../test/handlers'
import { server } from '../../test/server'
import { createApiFootballClient } from './client'

const config = { apiFootballKey: 'test-key', theSportsDbKey: '3' }

afterEach(() => server.resetHandlers())

describe('createApiFootballClient', () => {
  it('fails fast when no API key is configured', () => {
    expect(() => createApiFootballClient({ apiFootballKey: undefined, theSportsDbKey: '3' })).toThrow(
      ValidationError,
    )
  })

  it('sends the key header and returns the raw payload', async () => {
    let seenKey = ''
    server.use(
      http.get(`${API_FOOTBALL_URL}/teams`, ({ request }) => {
        seenKey = request.headers.get('x-apisports-key') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    const payload = await createApiFootballClient(config).get('/teams')
    expect(seenKey).toBe('test-key')
    expect(payload).toEqual({ ok: true })
  })

  it('appends query params to the request URL', async () => {
    let seenUrl = ''
    server.use(
      http.get(`${API_FOOTBALL_URL}/teams`, ({ request }) => {
        seenUrl = request.url
        return HttpResponse.json({ ok: true })
      }),
    )
    await createApiFootballClient(config).get('/teams', { league: '239', season: '2026' })
    expect(seenUrl).toContain('league=239')
    expect(seenUrl).toContain('season=2026')
  })

  it('maps HTTP 429 to ApiRateLimitError', async () => {
    server.use(http.get(`${API_FOOTBALL_URL}/teams`, () => HttpResponse.json({ message: 'rate' }, { status: 429 })))
    await expect(createApiFootballClient(config).get('/teams')).rejects.toThrow(ApiRateLimitError)
  })

  it('maps HTTP 500 to ApiError', async () => {
    server.use(http.get(`${API_FOOTBALL_URL}/teams`, () => HttpResponse.json({}, { status: 500 })))
    await expect(createApiFootballClient(config).get('/teams')).rejects.toThrow(ApiError)
  })

  it('maps a network failure to ApiError', async () => {
    server.use(http.get(`${API_FOOTBALL_URL}/teams`, () => HttpResponse.error()))
    await expect(createApiFootballClient(config).get('/teams')).rejects.toThrow(ApiError)
  })
})