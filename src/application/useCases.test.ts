import { describe, expect, it } from 'vitest'
import type { Fixture, MatchResult, Team } from '../domain/football/model'
import type { FixtureRepository, NextAndRecent, TeamRepository } from './data/ports'
import { createFootballUseCases } from './useCases'

const TEAMS: Team[] = [
  { id: '2893', name: 'Atlético Nacional', crestUrl: null },
  { id: '2900', name: 'Millonarios', crestUrl: null },
]

const NEXT_FIXTURE: Fixture = {
  id: '6101',
  home: 'Millonarios',
  away: 'Atlético Nacional',
  kickoffUtc: '2026-08-15T22:00:00Z',
  status: 'SCHEDULED',
}

const RESULTS: MatchResult[] = [
  { fixtureId: '6001', kickoffUtc: '2026-07-12T23:00:00Z', homeGoals: 2, awayGoals: 1, outcome: '1' },
]

function stubTeamRepository(teams: Team[]): TeamRepository {
  return { getTeams: async () => teams }
}

function stubFixtureRepository(feed: NextAndRecent): FixtureRepository {
  return { getNextAndRecent: async () => feed }
}

describe('createFootballUseCases', () => {
  it('getTeamCatalog returns the teams provided by the injected repository', async () => {
    const useCases = createFootballUseCases({
      teams: stubTeamRepository(TEAMS),
      fixtures: stubFixtureRepository({ next: NEXT_FIXTURE, results: RESULTS }),
    })

    await expect(useCases.getTeamCatalog()).resolves.toEqual(TEAMS)
  })

  it('getNextFixture returns the next fixture from the injected feed', async () => {
    const useCases = createFootballUseCases({
      teams: stubTeamRepository(TEAMS),
      fixtures: stubFixtureRepository({ next: NEXT_FIXTURE, results: RESULTS }),
    })

    await expect(useCases.getNextFixture('2900')).resolves.toEqual(NEXT_FIXTURE)
  })

  it('getNextFixture reports null when the feed has no upcoming fixture', async () => {
    const useCases = createFootballUseCases({
      teams: stubTeamRepository(TEAMS),
      fixtures: stubFixtureRepository({ next: null, results: RESULTS }),
    })

    await expect(useCases.getNextFixture('2900')).resolves.toBeNull()
  })

  it('getRecentResults returns the finished results from the injected feed', async () => {
    const useCases = createFootballUseCases({
      teams: stubTeamRepository(TEAMS),
      fixtures: stubFixtureRepository({ next: NEXT_FIXTURE, results: RESULTS }),
    })

    await expect(useCases.getRecentResults('2900')).resolves.toEqual(RESULTS)
  })

  it('getRecentResults reports an empty collection when the feed has no finished matches', async () => {
    const useCases = createFootballUseCases({
      teams: stubTeamRepository(TEAMS),
      fixtures: stubFixtureRepository({ next: NEXT_FIXTURE, results: [] }),
    })

    await expect(useCases.getRecentResults('2900')).resolves.toEqual([])
  })
})
