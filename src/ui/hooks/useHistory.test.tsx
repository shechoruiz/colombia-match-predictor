/**
 * Tests for useHistory (guía §6: history records are client data but the hook
 * layers them behind TanStack Query so loading/error/retry come free, matching
 * the app's server-state pattern). Reconcile runs against the selected team's
 * recent results; recording a prediction invalidates and re-reads the history.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { PredictionRecord } from '../../domain/football/model'
import type { HistoryUseCases } from '../../application/historyUseCase'
import { useHistory } from './useHistory'

function createWrapper(client: QueryClient): (props: { children: ReactNode }) => React.JSX.Element {
  return function Wrapper({ children }: { children: ReactNode }): React.JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function makeHistory(records: PredictionRecord[]): HistoryUseCases {
  let store = [...records]
  const reconcileHistory = vi.fn(async () => store)
  const readHistory = vi.fn(() => store)
  const recordPrediction = vi.fn((input: Parameters<HistoryUseCases['recordPrediction']>[0]) => {
    const existing = store.find((r) => r.fixtureId === input.fixtureId)
    const rec: PredictionRecord = existing ?? {
      fixtureId: input.fixtureId,
      home: input.home,
      away: input.away,
      kickoffUtc: input.kickoffUtc,
      predictedOutcome: input.predictedOutcome,
      model: 'poisson-elo-v1',
      createdAt: new Date().toISOString(),
      status: 'pending',
    }
    store = existing === undefined ? [...store, rec] : store.map((r) => (r.fixtureId === rec.fixtureId ? rec : r))
    return { ...rec }
  })
  return { reconcileHistory, readHistory, recordPrediction }
}

describe('useHistory', () => {
  it('starts empty when no history exists', async () => {
    const history = makeHistory([])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useHistory(null, history), {
      wrapper: createWrapper(client),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.records).toEqual([])
    expect(result.current.summary).toEqual({ hits: 0, misses: 0, pending: 0, window: 0 })
  })

  it('reconciles records against the selected team when a team is chosen', async () => {
    const records: PredictionRecord[] = [
      {
        fixtureId: 'f1',
        home: 'Millonarios',
        away: 'Atlético Nacional',
        kickoffUtc: '2026-08-01T20:00:00Z',
        predictedOutcome: '1',
        model: 'poisson-elo-v1',
        createdAt: '2026-08-01T21:00:00Z',
        status: 'hit',
      },
    ]
    const history = makeHistory(records)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useHistory('2893', history), {
      wrapper: createWrapper(client),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(history.reconcileHistory).toHaveBeenCalledWith('2893')
    expect(result.current.summary.hits).toBe(1)
  })

  it('re-reads history after recording a prediction', async () => {
    const history = makeHistory([])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useHistory(null, history), {
      wrapper: createWrapper(client),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    result.current.recordPrediction({
      fixtureId: 'f7',
      home: 'Millonarios',
      away: 'Atlético Nacional',
      kickoffUtc: '2026-08-15T22:00:00Z',
      predictedOutcome: '1',
    })
    await waitFor(() => expect(result.current.records).toHaveLength(1))
  })

  it('surfaces error to the consumer for retry state', async () => {
    const history = makeHistory([])
    history.reconcileHistory = vi.fn(async () => {
      throw new Error('down')
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useHistory('2893', history), {
      wrapper: createWrapper(client),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})