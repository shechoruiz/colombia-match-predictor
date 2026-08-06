/**
 * localStorage-backed history repository (design D10 + spec prediction-history:
 * persist on write, restore on reload, dedupe by fixture identity, corrupt
 * storage ignored safely). Storage is injected (guía §12) so tests run without
 * a browser; only domain types cross this boundary.
 */
import { isHistoryStatus, isOutcome1X2 } from '../domain/football/model'
import type { HistoryStatus, Outcome1X2, PredictionRecord } from '../domain/football/model'

export const HISTORY_STORAGE_KEY = 'predictionHistory'

export interface HistoryRepository {
  readAll(): PredictionRecord[]
  upsert(record: PredictionRecord): PredictionRecord[]
}

export interface HistoryRepositoryOptions {
  storage: Pick<Storage, 'getItem' | 'setItem'>
}

/** Defensive boundary guard (guía §11): valid entries load, corrupt ones drop. */
export function isPredictionRecord(value: unknown): value is PredictionRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.fixtureId === 'string' &&
    typeof record.home === 'string' &&
    typeof record.away === 'string' &&
    typeof record.kickoffUtc === 'string' &&
    isOutcome1X2(record.predictedOutcome) &&
    record.model === 'poisson-elo-v1' &&
    typeof record.createdAt === 'string' &&
    isHistoryStatus(record.status)
  )
}

export function createHistoryRepository(options: HistoryRepositoryOptions): HistoryRepository {
  const { storage } = options

  function readAll(): PredictionRecord[] {
    const raw = storage.getItem(HISTORY_STORAGE_KEY)
    if (raw === null) return []
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isPredictionRecord)
  }

  function upsert(record: PredictionRecord): PredictionRecord[] {
    const existing = readAll()
    const next = existing.some((item) => item.fixtureId === record.fixtureId)
      ? existing.map((item) => (item.fixtureId === record.fixtureId ? record : item))
      : [...existing, record]
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
    return next
  }

  return { readAll, upsert }
}

export type { HistoryStatus, Outcome1X2 }
