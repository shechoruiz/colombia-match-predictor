import { describe, expect, it } from 'vitest'
import type { PredictionInput } from '../football/model'
import { ValidationError } from '../errors'
import { computePrediction } from './predictor'

function baseInput(): PredictionInput {
  return {
    home: { attack: 2, defense: 1, elo: 1500 },
    away: { attack: 1, defense: 2, elo: 1500 },
    homeAdvantage: 1.2,
    leagueAvgGoals: { home: 1.6, away: 1.4 },
  }
}

function sum(probs: { home: number; draw: number; away: number }): number {
  return probs.home + probs.draw + probs.away
}

describe('computePrediction', () => {
  it('returns probabilities that sum to one', () => {
    expect(sum(computePrediction(baseInput()).probabilities)).toBeCloseTo(1, 9)
  })

  it('is deterministic: identical inputs yield identical predictions', () => {
    expect(computePrediction(baseInput())).toEqual(computePrediction(baseInput()))
  })

  it('applies home advantage so the home win probability exceeds the away side', () => {
    const prediction = computePrediction({
      ...baseInput(),
      home: { attack: 1, defense: 1, elo: 1500 },
      away: { attack: 1, defense: 1, elo: 1500 },
      leagueAvgGoals: { home: 1.5, away: 1.5 },
      homeAdvantage: 1.2,
    })
    expect(prediction.probabilities.home).toBeGreaterThan(
      prediction.probabilities.away,
    )
    expect(prediction.outcome).toBe('1')
  })

  it('keeps the predicted scoreline coherent with the outcome', () => {
    const strongHome = computePrediction({
      ...baseInput(),
      homeAdvantage: 1.8,
    })
    expect(strongHome.outcome).toBe('1')
    expect(strongHome.predictedScore.home).toBeGreaterThan(
      strongHome.predictedScore.away,
    )
  })

  it('reports an isolated draw when the two sides are perfectly balanced', () => {
    const tie = computePrediction({
      ...baseInput(),
      homeAdvantage: 1,
      home: { attack: 1, defense: 1, elo: 1500 },
      away: { attack: 1, defense: 1, elo: 1500 },
      leagueAvgGoals: { home: 1.5, away: 1.5 },
    })
    expect(tie.outcome).toBe('X')
  })
})

describe('computePrediction fail-fast validation', () => {
  it('throws a typed ValidationError when a required strength is missing', () => {
    const broken = {
      ...baseInput(),
      home: { defense: 1, elo: 1500 },
    } as unknown as PredictionInput

    expect(() => computePrediction(broken)).toThrow(ValidationError)
  })

  it('throws a typed ValidationError and never fabricates probabilities', () => {
    const broken = {
      ...baseInput(),
      homeAdvantage: undefined,
    } as unknown as PredictionInput

    expect(() => computePrediction(broken)).toThrow(ValidationError)
  })
})