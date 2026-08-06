import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { ApiError, ValidationError } from '../../domain/errors'
import {
  API_FOOTBALL_URL,
  finishedOnlyPayload,
  fixturesPayload,
  scheduledOnlyPayload,
  teamsPayload,
} from '../../test/handlers'
import { server } from '../../test/server'
import { createApiFootballClient } from './client'
import { createApiFootballRepository, mapFixtureStatus, outcomeFromGoals, toDomainResult } from './repositories'

const repo = createApiFootballRepository(
  createApiFootballClient({ apiFootballKey: 'test-key', theSportsDbKey: '3' }),
)

describe('createApiFootballRepository (MSW integration)', () => {
  it('maps the teams payload into domain teams', async () => {
    const teams = await repo.getTeams()
    expect(teams).toEqual([
      { id: '2893', name: 'Atlético Nacional', crestUrl: 'https://c.com/an.png' },
      { id: '2900', name: 'Millonarios', crestUrl: 'https://c.com/mil.png' },
    ])
  })

  it('splits the batched fixtures payload into next fixture and FINISHED results', async () => {
    const { next, results } = await repo.getNextAndRecent('2893')
    expect(next).toEqual({
      id: '1002',
      home: 'B',
      away: 'A',
      kickoffUtc: '2026-08-16T22:00:00Z',
      status: 'SCHEDULED',
    })
    expect(results).toEqual([{ fixtureId: '1001', homeGoals: 2, awayGoals: 1, outcome: '1' }])
  })

  it('returns a null next fixture when no match remains scheduled', async () => {
    server.use(http.get(`${API_FOOTBALL_URL}/fixtures`, () => HttpResponse.json(finishedOnlyPayload)))
    const { next, results } = await repo.getNextAndRecent('1')
    expect(next).toBeNull()
    expect(results).toHaveLength(2)
  })

  it('returns an empty results collection when no match is FINISHED', async () => {
    server.use(http.get(`${API_FOOTBALL_URL}/fixtures`, () => HttpResponse.json(scheduledOnlyPayload)))
    const { next, results } = await repo.getNextAndRecent('1')
    expect(next).toEqual({
      id: '2002',
      home: 'B',
      away: 'A',
      kickoffUtc: '2026-08-16T22:00:00Z',
      status: 'SCHEDULED',
    })
    expect(results).toEqual([])
  })

  it('surfaces a typed ValidationError on a malformed fixtures payload', async () => {
    server.use(
      http.get(`${API_FOOTBALL_URL}/fixtures`, () => HttpResponse.json({ response: [{ fixture: { id: 'x' } }] })),
    )
    await expect(repo.getNextAndRecent('1')).rejects.toThrow(ValidationError)
  })

  it('surfaces a typed ApiError when the upstream returns HTTP 500', async () => {
    server.use(http.get(`${API_FOOTBALL_URL}/teams`, () => HttpResponse.json({}, { status: 500 })))
    await expect(repo.getTeams()).rejects.toThrow(ApiError)
  })
})

describe('pure domain mappers', () => {
  it('maps status shorts to domain FixtureStatus', () => {
    expect(mapFixtureStatus('NS')).toBe('SCHEDULED')
    expect(mapFixtureStatus('T1')).toBe('IN_PLAY')
    expect(mapFixtureStatus('FT')).toBe('FINISHED')
    expect(mapFixtureStatus('AET')).toBe('FINISHED')
  })

  it('fails fast on an unhandled status short', () => {
    expect(() => mapFixtureStatus('CANC')).toThrow(ValidationError)
  })

  it('derives the 1X2 outcome from the full-time score', () => {
    expect(outcomeFromGoals(2, 1)).toBe('1')
    expect(outcomeFromGoals(1, 2)).toBe('2')
    expect(outcomeFromGoals(1, 1)).toBe('X')
  })

  it('rejects a FINISHED fixture whose goals are missing', () => {
    const item = {
      fixture: { id: 7, date: '2026-08-10T20:00:00Z', status: { short: 'FT' } },
      teams: { home: { name: 'A' }, away: { name: 'B' } },
      goals: { home: null, away: 1 },
    }
    expect(() => toDomainResult(item)).toThrow(ValidationError)
  })
})