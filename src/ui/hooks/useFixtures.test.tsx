/**
 * Tests for useFixtures (spec fixtures-data "Cache-first data access" + design
 * "TTL windows: next-fixture + results 15min"). Server state lives in TanStack
 * Query — the hook must not re-fetch within the stale window and must expose
 * loading/error/data for the consumer components.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { FootballUseCases } from '../../application/useCases'
import { useFixtures } from './useFixtures'

function createWrapper(client: QueryClient): (props: { children: ReactNode }) => React.JSX.Element {
  return function Wrapper({ children }: { children: ReactNode }): React.JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function createUseCases(overrides?: Partial<FootballUseCases>): FootballUseCases {
  return {
    getTeamCatalog: vi.fn(async () => []),
    getNextFixture: vi.fn(async (teamId) =>
      teamId === '2893'
        ? {
            id: '6101',
            home: 'Millonarios',
            away: 'Atlético Nacional',
            kickoffUtc: '2026-08-15T22:00:00Z',
            status: 'SCHEDULED' as const,
          }
        : null,
    ),
    getRecentResults: vi.fn(async (teamId) =>
      teamId === '2893'
        ? [{ fixtureId: '6001', kickoffUtc: '2026-07-12T23:00:00Z', homeGoals: 2, awayGoals: 1, outcome: '1' as const }]
        : [],
    ),
    ...overrides,
  }
}

describe('useFixtures', () => {
  it('fetches the next fixture and recent results for the selected team', async () => {
    const useCases = createUseCases()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useFixtures('2893', useCases), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.nextFixture?.home).toBe('Millonarios')
    expect(result.current.recentResults).toHaveLength(1)
    expect(result.current.recentResults[0]?.homeGoals).toBe(2)
    expect(useCases.getNextFixture).toHaveBeenCalledWith('2893')
    expect(useCases.getRecentResults).toHaveBeenCalledWith('2893')
  })

  it('returns null fixture and empty results for a team without matches', async () => {
    const useCases = createUseCases()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useFixtures('9999', useCases), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.nextFixture).toBeNull()
    expect(result.current.recentResults).toEqual([])
  })

  it('surfaces errors so the consumer can render the retry state', async () => {
    const useCases = createUseCases({
      getNextFixture: vi.fn(async () => {
        throw new Error('upstream down')
      }),
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useFixtures('2893', useCases), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isLoading).toBe(false)
  })

  it('does not re-fetch within the cache window (15 min staleTime)', async () => {
    const useCases = createUseCases()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 15 * 60 * 1000 } },
    })
    const wrapper = createWrapper(client)
    const first = renderHook(() => useFixtures('2893', useCases), { wrapper })
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))

    const second = renderHook(() => useFixtures('2893', useCases), { wrapper })
    await waitFor(() => expect(second.result.current.isLoading).toBe(false))

    expect(useCases.getNextFixture).toHaveBeenCalledTimes(1)
    expect(useCases.getRecentResults).toHaveBeenCalledTimes(1)
  })
})