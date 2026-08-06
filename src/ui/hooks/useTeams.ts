/**
 * Server-state hook for the team catalog (spec fixtures-data: grid data comes
 * from the injected use cases; 24h cache window per design TTL).
 */
import { useQuery } from '@tanstack/react-query'
import type { FootballUseCases } from '../../application/useCases'
import type { Team } from '../../domain/football/model'

export const TEAMS_STALE_TIME_MS = 24 * 60 * 60 * 1000

export interface TeamsState {
  teams: Team[] | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

export function useTeams(useCases: FootballUseCases): TeamsState {
  const query = useQuery({
    queryKey: ['teams'],
    queryFn: () => useCases.getTeamCatalog(),
    staleTime: TEAMS_STALE_TIME_MS,
  })

  return {
    teams: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: () => {
      void query.refetch()
    },
  }
}