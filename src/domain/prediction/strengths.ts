/**
 * Pure team-strength helpers for the Poisson + Elo predictor.
 * No I/O; every function is a deterministic function of its inputs (design D3).
 */
import type { TeamStrengths } from '../football/model'

/** A single recent result from the team's point of view. */
export interface RecentResult {
  goalsScored: number
  goalsConceded: number
}

/** Elo scale factor `k` from the design: `eloFactor = 10^((k·Δelo)/400)`, k ≈ 0.1. */
const ELO_SCALE_K = 0.1

/**
 * Elo adjustment used to scale expected goals from the rating gap. Symmetric so
 * that a negative gap yields the exact inverse of the positive gap.
 */
export function eloFactor(deltaElo: number): number {
  return Math.pow(10, (ELO_SCALE_K * deltaElo) / 400)
}

function average(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length
}

/**
 * Derives `attack`/`defense` from the average goals a team scored and conceded
 * across its recent results, keeping the supplied Elo rating. Pure and
 * deterministic; an empty sample yields neutral (zero) strength.
 */
export function computeStrengths(
  recentResults: readonly RecentResult[],
  elo: number,
): TeamStrengths {
  if (recentResults.length === 0) {
    return { attack: 0, defense: 0, elo }
  }
  const attack = average(recentResults.map((result) => result.goalsScored))
  const defense = average(recentResults.map((result) => result.goalsConceded))
  return { attack, defense, elo }
}