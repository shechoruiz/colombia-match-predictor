import { describe, expect, it } from 'vitest'
import { MOCK_FIXTURES, MOCK_LEAGUE, MOCK_TEAMS } from './data'
import { createMockSource } from './source'

// Smoke (3.12): the mock dataset stands in for league 239 (Liga BetPlay
// DIMAYOR) with Apertura/Clausura round naming, which is what the real
// league-239 smoke must confirm once an API key is available.
describe('mock league-239 dataset', () => {
  it('targets Liga BetPlay league 239 with Apertura and Clausura tournaments', () => {
    expect(MOCK_LEAGUE).toEqual({
      id: '239',
      name: 'Liga BetPlay DIMAYOR',
      tournaments: ['Apertura', 'Clausura'],
    })
  })

  it('labels every fixture round with Apertura or Clausura', () => {
    expect(MOCK_FIXTURES.length).toBeGreaterThan(0)
    for (const record of MOCK_FIXTURES) {
      const tournament = record.round.split(' · ')[0]
      expect(MOCK_LEAGUE.tournaments).toContain(tournament)
    }
  })
})

describe('createMockSource', () => {
  it('serves a non-empty team catalog in name order', async () => {
    const source = createMockSource()

    const teams = await source.teams.getTeams()

    expect(teams.map((team) => team.name)).toEqual([
      'América de Cali',
      'Atlético Nacional',
      'Deportivo Pasto',
      'Junior',
      'La Equidad',
      'Millonarios',
      'Once Caldas',
      'Santa Fe',
    ])
    expect(teams.length).toBe(MOCK_TEAMS.length)
  })

  it('returns the upcoming Clausura fixture for a team that has one', async () => {
    const source = createMockSource()

    const feed = await source.fixtures.getNextAndRecent('2900')

    expect(feed.next).not.toBeNull()
    expect(feed.next?.status).not.toBe('FINISHED')
    expect([feed.next?.home, feed.next?.away]).toContain('Millonarios')
  })

  it('reports no next fixture for a team whose matches are all finished', async () => {
    const source = createMockSource()

    const feed = await source.fixtures.getNextAndRecent('2908')

    expect(feed.next).toBeNull()
  })

  it('returns only FINISHED results with scores for a team', async () => {
    const source = createMockSource()

    const feed = await source.fixtures.getNextAndRecent('2900')

    expect(feed.results.length).toBeGreaterThan(0)
    for (const result of feed.results) {
      expect(result.outcome).toMatch(/^[1X2]$/)
    }
  })

  it('reports an empty results collection for a team with no finished matches', async () => {
    const source = createMockSource()

    const feed = await source.fixtures.getNextAndRecent('2905')

    expect(feed.results).toEqual([])
  })

  it('returns a harmless empty feed for an unknown team id', async () => {
    const source = createMockSource()

    const feed = await source.fixtures.getNextAndRecent('9999')

    expect(feed.next).toBeNull()
    expect(feed.results).toEqual([])
  })
})