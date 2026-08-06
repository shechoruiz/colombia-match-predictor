/**
 * Server-state hooks for fixtures (guía §6: server data lives in TanStack
 * Query, never in Zustand/useState). Runs the next-fixture and recent-results
 * queries for the selected team through the injected use cases; both use the
 * design's 15-minute cache window so we respect the 100 req/day cap.
 */
import { useQuery } from '@tanstack/react-query'
import type { FootballUseCases } from '../../application/useCases'
import type { Fixture, MatchResult } from '../../domain/football/model'

export const FIXTURE_STALE_TIME_MS = 15 * 60 * 1000

export interface FixturesState {
  nextFixture: Fixture | null
  recentResults: MatchResult[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Fetches next fixture + last results for a team; `teamId` null → idle. */
export function useFixtures(teamId: string | null, useCases: FootballUseCases): FixturesState {
  const nextQuery = useQuery({
    queryKey: ['nextFixture', teamId],
    queryFn: () => useCases.getNextFixture(teamId as string),
    enabled: teamId !== null,
    staleTime: FIXTURE_STALE_TIME_MS,
  })

  const resultsQuery = useQuery({
    queryKey: ['recentResults', teamId],
    queryFn: () => useCases.getRecentResults(teamId as string),
    enabled: teamId !== null,
    staleTime: FIXTURE_STALE_TIME_MS,
  })

  const idleNoSelection = teamId === null

  return {
    nextFixture: nextQuery.data ?? null,
    recentResults: resultsQuery.data ?? [],
    isLoading: idleNoSelection ? false : nextQuery.isPending || resultsQuery.isPending,
    isError: nextQuery.isError || resultsQuery.isError,
    refetch: async () => {
      await Promise.all([nextQuery.refetch(), resultsQuery.refetch()])
    },
  }
}