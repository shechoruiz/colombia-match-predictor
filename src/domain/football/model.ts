/**
 * Shared domain model for the football-predictor app.
 *
 * Pure, I/O-free types and literal-union guards. The guards let infrastructure
 * validate untrusted boundary values at the edge (guía §11) before they enter
 * domain logic; domain logic itself receives already-typed values.
 */

export type Outcome1X2 = '1' | 'X' | '2'

export type FixtureStatus = 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'FINISHED'

export type HistoryStatus = 'pending' | 'hit' | 'miss'

export interface Team {
  id: string
  name: string
  crestUrl: string | null
}

export interface Fixture {
  id: string
  home: string
  away: string
  kickoffUtc: string
  status: FixtureStatus
}

export interface MatchResult {
  fixtureId: string
  homeGoals: number
  awayGoals: number
  outcome: Outcome1X2
}

export interface TeamStrengths {
  attack: number
  defense: number
  elo: number
}

export interface PredictionInput {
  home: TeamStrengths
  away: TeamStrengths
  homeAdvantage: number
  leagueAvgGoals: { home: number; away: number }
}

export interface Prediction {
  probabilities: { home: number; draw: number; away: number }
  predictedScore: { home: number; away: number }
  outcome: Outcome1X2
  rationale: string
}

export interface PredictionRecord {
  fixtureId: string
  home: string
  away: string
  kickoffUtc: string
  predictedOutcome: Outcome1X2
  model: 'poisson-elo-v1'
  createdAt: string
  status: HistoryStatus
}

function isOneOf(value: unknown, members: readonly string[]): boolean {
  return typeof value === 'string' && members.includes(value)
}

export function isOutcome1X2(value: unknown): value is Outcome1X2 {
  return isOneOf(value, ['1', 'X', '2'])
}

export function isFixtureStatus(value: unknown): value is FixtureStatus {
  return isOneOf(value, ['SCHEDULED', 'TIMED', 'IN_PLAY', 'FINISHED'])
}

export function isHistoryStatus(value: unknown): value is HistoryStatus {
  return isOneOf(value, ['pending', 'hit', 'miss'])
}