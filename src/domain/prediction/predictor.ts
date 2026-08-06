/**
 * Prediction orchestration (pure domain): hoists strengths → expected goals →
 * Poisson probabilities → most-likely scoreline, with fail-fast validation.
 * No I/O; deterministic given its inputs (design D3, spec match-prediction).
 */
import type { Outcome1X2, Prediction, PredictionInput } from '../football/model'
import { ValidationError } from '../errors'
import { independentPoisson1X2 } from './poisson'
import { eloFactor } from './strengths'
import { buildRationale } from './language'

/** Tolerance below which two outcomes are treated as tied (spec "equal probabilities"). */
const OUTCOME_TIE_TOLERANCE = 1e-9

/** Picks the dominant outcome, resolving within-tolerance ties to the draw. */
function deriveOutcome(probabilities: { home: number; draw: number; away: number }): Outcome1X2 {
  const candidates: Array<{ outcome: Outcome1X2; value: number }> = [
    { outcome: '1', value: probabilities.home },
    { outcome: 'X', value: probabilities.draw },
    { outcome: '2', value: probabilities.away },
  ]
  const ranked = candidates.sort((a, b) => b.value - a.value)

  const [top, runnerUp] = ranked
  if (!top || !runnerUp) {
    throw new ValidationError('Unable to rank prediction outcomes')
  }
  if (top.value - runnerUp.value <= OUTCOME_TIE_TOLERANCE) {
    return 'X'
  }
  return top.outcome
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Fail fast (guía §3): reject an incomplete input before any probability is
 * fabricated, per spec "Prediction requires complete inputs".
 */
function assertCompleteInput(input: PredictionInput): void {
  const missing: string[] = []

  if (!isFiniteNumber(input.home?.attack)) missing.push('home.attack')
  if (!isFiniteNumber(input.home?.defense)) missing.push('home.defense')
  if (!isFiniteNumber(input.home?.elo)) missing.push('home.elo')
  if (!isFiniteNumber(input.away?.attack)) missing.push('away.attack')
  if (!isFiniteNumber(input.away?.defense)) missing.push('away.defense')
  if (!isFiniteNumber(input.away?.elo)) missing.push('away.elo')
  if (!isFiniteNumber(input.homeAdvantage)) missing.push('homeAdvantage')
  if (!isFiniteNumber(input.leagueAvgGoals?.home)) missing.push('leagueAvgGoals.home')
  if (!isFiniteNumber(input.leagueAvgGoals?.away)) missing.push('leagueAvgGoals.away')

  if (missing.length > 0) {
    throw new ValidationError(`Prediction input incomplete: ${missing.join(', ')}`)
  }
}

/** Expected goals for the home side: league avg × attack × opp. defense × advantage × elo. */
function lambdaHome(input: PredictionInput): number {
  return (
    input.leagueAvgGoals.home *
    input.home.attack *
    input.away.defense *
    input.homeAdvantage *
    eloFactor(input.home.elo - input.away.elo)
  )
}

/** Expected goals for the away side: mirror of home, without the home-advantage boost. */
function lambdaAway(input: PredictionInput): number {
  return (
    input.leagueAvgGoals.away *
    input.away.attack *
    input.home.defense *
    eloFactor(input.away.elo - input.home.elo)
  )
}

/**
 * Computes a full 1X2 prediction from team strengths. Fails fast with a typed
 * ValidationError when any required input is missing, rather than returning
 * fabricated probabilities (spec "Prediction requires complete inputs").
 */
export function computePrediction(input: PredictionInput): Prediction {
  assertCompleteInput(input)

  const { probabilities, predictedScore } = independentPoisson1X2(
    lambdaHome(input),
    lambdaAway(input),
  )
  const outcome = deriveOutcome(probabilities)

  return { probabilities, predictedScore, outcome, rationale: buildRationale(outcome) }
}