/**
 * Tests for useTeams (spec fixtures-data: catalog loads into the grid; error
 * surfaces to the retry state). Server state via TanStack Query, 24h cache
 * window per the design TTL for teams.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { FootballUseCases } from '../../application/useCases'
import type { Team } from '../../domain/football/model'
import { TEAMS_STALE_TIME_MS, useTeams } from './useTeams'

function createWrapper(client: QueryClient): (props: { children: ReactNode }) => React.JSX.Element {
  return function Wrapper({ children }: { children: ReactNode }): React.JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const TEAMS: Team[] = [
  { id: '2893', name: 'Atlético Nacional', crestUrl: null },
  { id: '2900', name: 'Millonarios', crestUrl: null },
]

describe('useTeams', () => {
  it('loads the team catalog from the injected use cases', async () => {
    const useCases = {
      getTeamCatalog: vi.fn(async () => TEAMS),
      getNextFixture: vi.fn(),
      getRecentResults: vi.fn(),
    } as unknown as FootballUseCases
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useTeams(useCases), { wrapper: createWrapper(client) })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.teams).toHaveLength(2)
    expect(result.current.teams?.[0]?.name).toBe('Atlético Nacional')
    expect(useCases.getTeamCatalog).toHaveBeenCalledTimes(1)
  })

  it('surfaces errors so the grid renders the retry state', async () => {
    const useCases = {
      getTeamCatalog: vi.fn(async () => {
        throw new Error('down')
      }),
      getNextFixture: vi.fn(),
      getRecentResults: vi.fn(),
    } as unknown as FootballUseCases
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useTeams(useCases), { wrapper: createWrapper(client) })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.teams).toBeNull()
  })

  it('uses the 24h cache window for the team catalog', () => {
    expect(TEAMS_STALE_TIME_MS).toBe(24 * 60 * 60 * 1000)
  })
})