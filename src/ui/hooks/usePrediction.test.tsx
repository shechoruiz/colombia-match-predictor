/**
 * Tests for usePrediction (guía §6 + design data flow: fixtures from Query +
 * pure domain predictor, then the panel only renders). A pure helper derives
 * strengths from the selected team's recent results, then computePrediction
 * builds the outcome — both deterministic and testable without any mock.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { MatchResult } from '../../domain/football/model'
import {
  buildPredictionFromRecent,
  DEFAULT_NEUTRAL_STRENGTHS,
  usePrediction,
} from './usePrediction'

function createWrapper(client: QueryClient): (props: { children: ReactNode }) => React.JSX.Element {
  return function Wrapper({ children }: { children: ReactNode }): React.JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function results(overrides: Partial<MatchResult> = {}): MatchResult[] {
  return [
    { fixtureId: '6001', kickoffUtc: '2026-07-12T23:00:00Z', homeGoals: 3, awayGoals: 1, outcome: '1', ...overrides },
    { fixtureId: '6002', kickoffUtc: '2026-07-13T21:00:00Z', homeGoals: 2, awayGoals: 1, outcome: '1', ...overrides },
  ]
}

describe('buildPredictionFromRecent', () => {
  it('builds a Prediction with probabilities summing to one', () => {
    const prediction = buildPredictionFromRecent(results())
    expect(prediction).not.toBeNull()
    const p = prediction as NonNullable<ReturnType<typeof buildPredictionFromRecent>>
    const sum = p.probabilities.home + p.probabilities.draw + p.probabilities.away
    expect(sum).toBeCloseTo(1, 9)
    expect(p.predictedScore).toHaveProperty('home')
    expect(p.predictedScore).toHaveProperty('away')
    expect(p.outcome).toBeTruthy()
  })

  it('returns null when there are no recent results to derive strengths from', () => {
    expect(buildPredictionFromRecent([])).toBeNull()
  })

  it('uses provided neutral strengths for the opponent side', () => {
    expect(DEFAULT_NEUTRAL_STRENGTHS).toEqual({ attack: 1, defense: 1, elo: 1200 })
  })
})

describe('usePrediction', () => {
  function createUseCases() {
    return {
      getTeamCatalog: vi.fn(async () => []),
      getNextFixture: vi.fn(async () => ({
        id: '6101',
        home: 'Millonarios',
        away: 'Atlético Nacional',
        kickoffUtc: '2026-08-15T22:00:00Z',
        status: 'SCHEDULED' as const,
      })),
      getRecentResults: vi.fn(async () => results()),
    }
  }

  it('produces a prediction state once the fixtures resolve', async () => {
    const useCases = createUseCases()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => usePrediction('2893', useCases as unknown as Parameters<typeof usePrediction>[1]),
      { wrapper: createWrapper(client) },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.prediction).not.toBeNull()
    expect(result.current.prediction?.probabilities.home).toBeGreaterThan(0)
    expect(result.current.homeName).toBe('Millonarios')
    expect(result.current.awayName).toBe('Atlético Nacional')
  })

  it('returns null prediction when there are no recent results', async () => {
    const useCases = createUseCases()
    useCases.getRecentResults = vi.fn(async () => [])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => usePrediction('2893', useCases),
      { wrapper: createWrapper(client) },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.prediction).toBeNull()
  })

  it('propagates errors for the consumer retry state', async () => {
    const useCases = createUseCases()
    useCases.getRecentResults = vi.fn(async () => {
      throw new Error('down')
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => usePrediction('2893', useCases),
      { wrapper: createWrapper(client) },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})