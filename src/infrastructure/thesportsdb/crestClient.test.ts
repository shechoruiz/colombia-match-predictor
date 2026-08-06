import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { ValidationError } from '../../domain/errors'
import { THESPORTSDB_SEARCH_URL } from '../../test/handlers'
import { server } from '../../test/server'
import { createTtlCache } from '../cache/ttlCache'
import { createCrestClient, PLACEHOLDER_CREST_URL } from './crestClient'

const config = { apiFootballKey: undefined, theSportsDbKey: '3' }

function makeClient() {
  return createCrestClient(config, createTtlCache())
}

describe('createCrestClient', () => {
  it('returns the badge URL when the team is found', async () => {
    await expect(makeClient().getCrest('Atlético Nacional')).resolves.toBe('https://c.com/an-badge.png')
  })

  it('falls back to the placeholder when no team is returned', async () => {
    server.use(http.get(THESPORTSDB_SEARCH_URL, () => HttpResponse.json({ teams: null })))
    await expect(makeClient().getCrest('Unknown FC')).resolves.toBe(PLACEHOLDER_CREST_URL)
  })

  it('falls back to the placeholder when the service returns HTTP 500', async () => {
    server.use(http.get(THESPORTSDB_SEARCH_URL, () => HttpResponse.json({}, { status: 500 })))
    await expect(makeClient().getCrest('X')).resolves.toBe(PLACEHOLDER_CREST_URL)
  })

  it('fails fast with a typed error on a malformed payload', async () => {
    server.use(http.get(THESPORTSDB_SEARCH_URL, () => HttpResponse.json({ teams: [{ id: 1 }] })))
    await expect(makeClient().getCrest('X')).rejects.toThrow(ValidationError)
  })

  it('serves the crest from cache on repeat lookups', async () => {
    let calls = 0
    server.use(
      http.get(THESPORTSDB_SEARCH_URL, () => {
        calls += 1
        return HttpResponse.json({ teams: [{ strTeamBadge: 'https://c.com/b.png' }] })
      }),
    )
    const client = makeClient()
    await client.getCrest('Atlético Nacional')
    await client.getCrest('Atlético Nacional')
    expect(calls).toBe(1)
  })
})