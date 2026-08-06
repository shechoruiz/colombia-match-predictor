/**
 * API-Football adapter: maps the Zod-validated wire payloads into domain types
 * (Team, Fixture, MatchResult). A single batched call
 * `fixtures?team={id}&last=10&next=1` feeds both the next fixture and the
 * recent results, so we respect the daily request cap.
 */
import { ValidationError } from '../../domain/errors'
import type { Fixture, FixtureStatus, MatchResult, Outcome1X2, Team } from '../../domain/football/model'
import type { ApiFootballClient } from './client'
import { parseFixturesResponse, parseTeamsResponse, type FixtureApiItem, type TeamEntryApi } from './schemas'

export interface NextAndRecent {
  next: Fixture | null
  results: MatchResult[]
}

export interface FootballDataRepository {
  getTeams(): Promise<Team[]>
  getNextAndRecent(teamId: string): Promise<NextAndRecent>
}

export function createApiFootballRepository(client: ApiFootballClient): FootballDataRepository {
  return {
    async getTeams() {
      const raw = await client.get('/teams', { league: '239', season: currentSeason() })
      return parseTeamsResponse(raw).map(toDomainTeam)
    },
    async getNextAndRecent(teamId) {
      const raw = await client.get('/fixtures', { team: teamId, last: '10', next: '1' })
      return splitFixtures(parseFixturesResponse(raw))
    },
  }
}

export function toDomainTeam(entry: TeamEntryApi): Team {
  return { id: String(entry.team.id), name: entry.team.name, crestUrl: entry.team.logo }
}

const FIXTURE_STATUS_MAP: Readonly<Record<string, FixtureStatus>> = {
  NS: 'SCHEDULED',
  PST: 'SCHEDULED',
  TBD: 'SCHEDULED',
  T1: 'IN_PLAY',
  T2: 'IN_PLAY',
  T3: 'IN_PLAY',
  T4: 'IN_PLAY',
  HT: 'IN_PLAY',
  ET: 'IN_PLAY',
  BT: 'IN_PLAY',
  P: 'IN_PLAY',
  LIVE: 'IN_PLAY',
  FT: 'FINISHED',
  AET: 'FINISHED',
  PEN: 'FINISHED',
}

const FINISHED_STATUS_SHORTS: ReadonlySet<string> = new Set(['FT', 'AET', 'PEN'])

export function mapFixtureStatus(short: string): FixtureStatus {
  const status = FIXTURE_STATUS_MAP[short]
  if (status === undefined) {
    throw new ValidationError(`Unhandled API-Football fixture status: ${short}`)
  }
  return status
}

export function toDomainFixture(item: FixtureApiItem): Fixture {
  return {
    id: String(item.fixture.id),
    home: item.teams.home.name,
    away: item.teams.away.name,
    kickoffUtc: item.fixture.date,
    status: mapFixtureStatus(item.fixture.status.short),
  }
}

export function outcomeFromGoals(home: number, away: number): Outcome1X2 {
  return home > away ? '1' : home < away ? '2' : 'X'
}

export function toDomainResult(item: FixtureApiItem): MatchResult {
  const { home, away } = item.goals
  if (home === null || away === null) {
    throw new ValidationError(`FINISHED fixture ${item.fixture.id} is missing its full-time goals`)
  }
  return {
    fixtureId: String(item.fixture.id),
    kickoffUtc: item.fixture.date,
    homeGoals: home,
    awayGoals: away,
    outcome: outcomeFromGoals(home, away),
  }
}

function splitFixtures(items: FixtureApiItem[]): NextAndRecent {
  // Skip statuses we cannot represent (e.g. CANC) so one odd match never
  // blocks the whole feed; mapFixtureStatus stays strict for what we keep.
  const known = items.filter((item) => FIXTURE_STATUS_MAP[item.fixture.status.short] !== undefined)
  const nextItem = known.find((item) => !FINISHED_STATUS_SHORTS.has(item.fixture.status.short))
  return {
    next: nextItem === undefined ? null : toDomainFixture(nextItem),
    results: known
      .filter((item) => FINISHED_STATUS_SHORTS.has(item.fixture.status.short))
      .map(toDomainResult),
  }
}

function currentSeason(): string {
  return String(new Date().getFullYear())
}