import { describe, expect, it } from 'vitest'
import { independentPoisson1X2, poissonPmf } from './poisson'

const SUM_TOLERANCE = 1e-9

function sum(probs: { home: number; draw: number; away: number }): number {
  return probs.home + probs.draw + probs.away
}

describe('poissonPmf', () => {
  it('returns one for a zero-goal expectation', () => {
    expect(poissonPmf(0, 0)).toBeCloseTo(1, 9)
    expect(poissonPmf(0, 3)).toBeCloseTo(0, 9)
  })

  it('captures nearly all probability mass within the 0..6 grid', () => {
    let total = 0
    for (let goals = 0; goals <= 6; goals += 1) {
      total += poissonPmf(2.2, goals)
    }
    // The grid intentionally truncates the tail; the mass kept must stay ≥ 99%.
    expect(total).toBeGreaterThan(0.99)
    expect(total).toBeLessThan(1)
  })
})

describe('independentPoisson1X2', () => {
  const equal = independentPoisson1X2(1.5, 1.5)
  const advantage = independentPoisson1X2(2.6, 1.0)

  it('renormalizes so the three outcomes sum to one', () => {
    expect(sum(equal.probabilities)).toBeCloseTo(1, 9)
    expect(sum(advantage.probabilities)).toBeCloseTo(1, 9)
  })

  it('is deterministic for identical inputs', () => {
    expect(independentPoisson1X2(1.5, 1.5)).toEqual(equal)
  })

  it('balances the two sides for equal lambdas', () => {
    expect(equal.probabilities.home).toBeCloseTo(equal.probabilities.away, 9)
    expect(equal.probabilities.draw).toBeGreaterThan(0)
    expect(equal.probabilities.draw).toBeLessThan(1)
  })

  it('favours the home side when its expected goals dominate', () => {
    expect(advantage.probabilities.home).toBeGreaterThan(
      advantage.probabilities.away,
    )
    expect(advantage.probabilities.home).toBeGreaterThan(
      advantage.probabilities.draw,
    )
  })

  it('keeps the predicted scoreline inside the 0..6 grid', () => {
    expect(equal.predictedScore.home).toBeGreaterThanOrEqual(0)
    expect(equal.predictedScore.home).toBeLessThanOrEqual(6)
    expect(equal.predictedScore.away).toBeGreaterThanOrEqual(0)
    expect(equal.predictedScore.away).toBeLessThanOrEqual(6)
  })

  it('treats the renormalization uncertainty as below the tolerance', () => {
    expect(Math.abs(sum(equal.probabilities) - 1)).toBeLessThan(SUM_TOLERANCE)
  })
})