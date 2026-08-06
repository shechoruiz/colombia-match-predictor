/**
 * Prediction hook (design data flow: fixtures via Query + pure domain
 * predictor → PredictionPanel). Uses useFixtures to fetch the selected team's
 * next fixture and recent results, derives attack/defense strengths from those
 * results with computeStrengths, and runs the pure computePrediction model.
 * The panel consumes only the resulting state — no prediction logic here
 * beyond composition.
 */
import type { FootballUseCases } from '../../application/useCases'
import type { Fixture, MatchResult, Prediction } from '../../domain/football/model'
import { computePrediction } from '../../domain/prediction/predictor'
import { computeStrengths, type RecentResult } from '../../domain/prediction/strengths'
import { useFixtures } from './useFixtures'

/** Neutral opponent profile when we have no results for the other side. */
export const DEFAULT_NEUTRAL_STRENGTHS = { attack: 1, defense: 1, elo: 1200 }

/** Default Elo used when no history exists for the selected team. */
const DEFAULT_ELO = 1200

/** Default league average goals per side (Liga BetPlay, design constants). */
const LEAGUE_AVG_GOALS = { home: 1.35, away: 1.15 }

/** Home advantage multiplier (design D3). */
const HOME_ADVANTAGE = 1.15

function toRecentResults(results: readonly MatchResult[]): RecentResult[] {
  return results.map((result) => ({
    goalsScored: result.homeGoals,
    goalsConceded: result.awayGoals,
  }))
}

/**
 * Builds a Prediction from the selected team's recent results, or null when
 * there is no form to derive strengths from (the consumer renders empty).
 * Pure and deterministic — easy to unit test without any mock.
 */
export function buildPredictionFromRecent(results: readonly MatchResult[]): Prediction | null {
  if (results.length === 0) {
    return null
  }
  const strengths = computeStrengths(toRecentResults(results), DEFAULT_ELO)
  return computePrediction({
    home: strengths,
    away: DEFAULT_NEUTRAL_STRENGTHS,
    homeAdvantage: HOME_ADVANTAGE,
    leagueAvgGoals: LEAGUE_AVG_GOALS,
  })
}

export interface PredictionHookState {
  prediction: Prediction | null
  nextFixture: Fixture | null
  homeName: string
  awayName: string
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Computes the prediction for the selected team, or an idle/empty state. */
export function usePrediction(teamId: string | null, useCases: FootballUseCases): PredictionHookState {
  const fixtures = useFixtures(teamId, useCases)

  const prediction = fixtures.nextFixture === null
    ? null
    : buildPredictionFromRecent(fixtures.recentResults)

  return {
    prediction,
    nextFixture: fixtures.nextFixture,
    homeName: fixtures.nextFixture?.home ?? '',
    awayName: fixtures.nextFixture?.away ?? '',
    isLoading: fixtures.isLoading,
    isError: fixtures.isError,
    refetch: fixtures.refetch,
  }
}