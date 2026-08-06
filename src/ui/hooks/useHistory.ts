/**
 * History hook (design data flow + spec prediction-history: records reconcile
 * against the last finished matches of the selected team). Records are client
 * data, but we layer them behind TanStack Query so loading/error/retry and the
 * re-read-after-record invalidation come for free, matching the app pattern.
 * Pure composition: calls the injected history use cases, never storage.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { HistoryUseCases, RecordPredictionInput } from '../../application/historyUseCase'
import { countHistory } from '../../domain/history/reconcile'
import type { PredictionRecord } from '../../domain/football/model'

export interface HistoryState {
  records: PredictionRecord[]
  summary: ReturnType<typeof countHistory>
  isLoading: boolean
  isError: boolean
  refetch: () => void
  recordPrediction: (input: RecordPredictionInput) => void
}

/** Reads (or reconciles) the history; `teamId` null → just read the backlog. */
export function useHistory(teamId: string | null, history: HistoryUseCases): HistoryState {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['history', teamId],
    queryFn: async () =>
      teamId === null ? history.readHistory() : history.reconcileHistory(teamId),
    staleTime: 0,
  })

  function recordPrediction(input: RecordPredictionInput): void {
    history.recordPrediction(input)
    void queryClient.invalidateQueries({ queryKey: ['history'] })
  }

  const records = query.data ?? []
  return {
    records,
    summary: countHistory(records),
    isLoading: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
    recordPrediction,
  }
}