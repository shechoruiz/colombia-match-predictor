/**
 * Mock source: key-less repositories implementing the application ports
 * (guía §12 — infra implements the interface the application defines). Serves
 * the sample dataset and mirrors the API-Football feed shape, so switching to
 * the real source later never touches the application layer.
 */
import { ValidationError } from '../../domain/errors'
import type { MatchResult } from '../../domain/football/model'
import type { FixtureRepository, TeamRepository } from '../../application/data/ports'
import { outcomeFromGoals } from '../api-football/repositories'
import { MOCK_FIXTURES, MOCK_TEAMS, type MockFixtureRecord } from './data'

export interface MockDataSources {
  teams: TeamRepository
  fixtures: FixtureRepository
}

export function createMockSource(): MockDataSources {
  return {
    teams: {
      async getTeams() {
        return MOCK_TEAMS.map((team) => ({ ...team })).sort((a, b) => a.name.localeCompare(b.name))
      },
    },
    fixtures: {
      async getNextAndRecent(teamId) {
        const matches = MOCK_FIXTURES.filter(
          (record) => record.homeTeamId === teamId || record.awayTeamId === teamId,
        )
        const next = matches.find((record) => record.fixture.status !== 'FINISHED')
        return {
          next: next === undefined ? null : { ...next.fixture },
          results: matches
            .filter((record) => record.fixture.status === 'FINISHED')
            .map(toMockResult),
        }
      },
    },
  }
}

function toMockResult(record: MockFixtureRecord): MatchResult {
  if (record.homeGoals === null || record.awayGoals === null) {
    throw new ValidationError(`Mock fixture ${record.fixture.id} is FINISHED but has no goals`)
  }
  return {
    fixtureId: record.fixture.id,
    kickoffUtc: record.fixture.kickoffUtc,
    homeGoals: record.homeGoals,
    awayGoals: record.awayGoals,
    outcome: outcomeFromGoals(record.homeGoals, record.awayGoals),
  }
}