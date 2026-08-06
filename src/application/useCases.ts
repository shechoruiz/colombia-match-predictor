/**
 * Application use cases. Each one receives its repositories by injection
 * (`createFootballUseCases`) — never constructs them (guía §12) — so the
 * application layer stays free of any infrastructure import. Consumers (UI
 * hooks/composition root) talk to this surface, not to a concrete source.
 */
import type { Fixture, MatchResult, Team } from '../domain/football/model'
import type { FixtureRepository, TeamRepository } from './data/ports'

export interface FootballUseCases {
  getTeamCatalog(): Promise<Team[]>
  getNextFixture(teamId: string): Promise<Fixture | null>
  getRecentResults(teamId: string): Promise<MatchResult[]>
}

export function createFootballUseCases(repos: {
  teams: TeamRepository
  fixtures: FixtureRepository
}): FootballUseCases {
  return {
    async getTeamCatalog() {
      return repos.teams.getTeams()
    },
    async getNextFixture(teamId) {
      const { next } = await repos.fixtures.getNextAndRecent(teamId)
      return next
    },
    async getRecentResults(teamId) {
      const { results } = await repos.fixtures.getNextAndRecent(teamId)
      return results
    },
  }
}