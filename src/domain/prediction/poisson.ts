/**
 * Independent-Poisson 1X2 engine (design D3 / "Predictor Algorithm").
 * Builds the 7×7 goals grid (0–6), sums margins into P1/PX/P2, renormalizes
 * within the 1e-9 tolerance, and picks the argmax cell as the scoreline.
 * Pure and deterministic: same lambdas → same result, no I/O.
 */

export const GOAL_GRID_MAX = 6

/** Renormalization tolerance: results are rounded so the sum is within 1e-9 of 1. */
export const RENORMALIZATION_TOLERANCE = 1e-9

export interface OutcomeProbabilities {
  home: number
  draw: number
  away: number
}

export interface PoissonOutcome {
  probabilities: OutcomeProbabilities
  predictedScore: { home: number; away: number }
}

function factorial(n: number): number {
  let result = 1
  for (let i = 2; i <= n; i += 1) result *= i
  return result
}

/** P(X = goals) for a Poisson process with the given mean. */
export function poissonPmf(mean: number, goals: number): number {
  return (Math.exp(-mean) * Math.pow(mean, goals)) / factorial(goals)
}

/**
 * Computes 1X2 probabilities and the most likely scoreline from the two
 * expected-goal values, using an independent Poisson grid of 0–6 goals per
 * side. Margins are renormalized so the three probabilities sum to one.
 */
export function independentPoisson1X2(
  lambdaHome: number,
  lambdaAway: number,
): PoissonOutcome {
  let homeSum = 0
  let drawSum = 0
  let awaySum = 0
  let bestProbability = -1
  let bestHome = 0
  let bestAway = 0

  for (let homeGoals = 0; homeGoals <= GOAL_GRID_MAX; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= GOAL_GRID_MAX; awayGoals += 1) {
      const cell =
        poissonPmf(lambdaHome, homeGoals) * poissonPmf(lambdaAway, awayGoals)

      if (homeGoals > awayGoals) homeSum += cell
      else if (homeGoals === awayGoals) drawSum += cell
      else awaySum += cell

      if (cell > bestProbability) {
        bestProbability = cell
        bestHome = homeGoals
        bestAway = awayGoals
      }
    }
  }

  const total = homeSum + drawSum + awaySum

  return {
    probabilities: {
      home: homeSum / total,
      draw: drawSum / total,
      away: awaySum / total,
    },
    predictedScore: { home: bestHome, away: bestAway },
  }
}