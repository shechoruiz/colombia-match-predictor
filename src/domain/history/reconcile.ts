/**
 * Pure history reconciliation (design D10 + spec prediction-history):
 * marks each stored prediction hit/miss/pending against the real full-time
 * 1X2 outcome of the corresponding FINISHED fixture, limited to the last 5
 * FINISHED matches of the involved team(s). Deterministic, no I/O.
 *
 * A record is `pending` when its fixture is not among the resolved
 * `windowResults` — either the match is not yet FINISHED, or it falls outside
 * the last-5 window. Pending records never count toward the aggregate.
 */
import type { HistoryStatus, MatchResult, PredictionRecord } from '../football/model'

/** The reconciliation window: only the latest N FINISHED results count. */
export const RECONCILE_WINDOW_SIZE = 5

function reconcileOne(record: PredictionRecord, outcome: MatchResult['outcome']): HistoryStatus {
  return record.predictedOutcome === outcome ? 'hit' : 'miss'
}

/**
 * Takes a feed of FINISHED results (any order; the real API and the MSW
 * handlers arrive newest-first) and returns a copy of `records` with each
 * `status` updated. The feed is normalized internally by ascending
 * `kickoffUtc` before the last-5 window is taken, so the caller never depends
 * on feed order. Records whose fixture is not inside the window keep
 * `pending`.
 */
export function reconcileRecords(
  records: readonly PredictionRecord[],
  finishedResults: readonly MatchResult[],
): PredictionRecord[] {
  const sorted = [...finishedResults].sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))
  const window = sorted.slice(-RECONCILE_WINDOW_SIZE)
  const outcomeById = new Map(window.map((r) => [r.fixtureId, r.outcome]))
  return records.map((record) => {
    const outcome = outcomeById.get(record.fixtureId)
    const status: HistoryStatus = outcome === undefined ? 'pending' : reconcileOne(record, outcome)
    return { ...record, status }
  })
}

export interface HistorySummary {
  hits: number
  misses: number
  pending: number
  /** Resolved (= hit + miss) records. Pending never affects the denominator. */
  window: number
}

/** Aggregates resolved records into hit count and the resolved window. */
export function countHistory(records: readonly PredictionRecord[]): HistorySummary {
  let hits = 0
  let misses = 0
  let pending = 0
  for (const record of records) {
    if (record.status === 'hit') hits += 1
    else if (record.status === 'miss') misses += 1
    else pending += 1
  }
  return { hits, misses, pending, window: hits + misses }
}