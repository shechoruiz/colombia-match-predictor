import { describe, expect, it } from 'vitest'
import type { RecentResult } from './strengths'
import { computeStrengths, eloFactor } from './strengths'

describe('eloFactor', () => {
  it('returns 1 when the Elo gap is zero', () => {
    expect(eloFactor(0)).toBeCloseTo(1, 9)
  })

  it('scales super-linearly for a positive Elo gap', () => {
    expect(eloFactor(400)).toBeCloseTo(Math.pow(10, 0.1), 9)
  })

  it('is symmetric: a negative gap inverts the factor', () => {
    expect(eloFactor(-400)).toBeCloseTo(1 / eloFactor(400), 9)
  })
})

describe('computeStrengths', () => {
  const recent: readonly RecentResult[] = [
    { goalsScored: 2, goalsConceded: 0 },
    { goalsScored: 3, goalsConceded: 1 },
    { goalsScored: 1, goalsConceded: 2 },
  ]

  it('derives attack as the average goals scored', () => {
    expect(computeStrengths(recent, 1500).attack).toBeCloseTo(2, 9)
  })

  it('derives defense as the average goals conceded', () => {
    expect(computeStrengths(recent, 1500).defense).toBeCloseTo(1, 9)
  })

  it('keeps the supplied Elo rating unchanged', () => {
    expect(computeStrengths(recent, 1234).elo).toBe(1234)
  })

  it('falls back to a neutral strength for an empty sample', () => {
    const elo = 1450
    expect(computeStrengths([], elo).attack).toBe(0)
    expect(computeStrengths([], elo).defense).toBe(0)
    expect(computeStrengths([], elo).elo).toBe(elo)
  })
})