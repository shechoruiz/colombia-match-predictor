/**
 * Application ports: the repository contracts the use cases depend on (guía
 * §12 — DI behind an interface). Infrastructure adapters (API-Football, mock,
 * cache) implement these; the application layer never imports infrastructure.
 * Only domain types cross this boundary.
 */
import type { Fixture, MatchResult, Team } from '../../domain/football/model'

/** Next scheduled fixture plus the last-N FINISHED results for one team. */
export interface NextAndRecent {
  next: Fixture | null
  results: MatchResult[]
}

export interface TeamRepository {
  getTeams(): Promise<Team[]>
}

export interface FixtureRepository {
  getNextAndRecent(teamId: string): Promise<NextAndRecent>
}