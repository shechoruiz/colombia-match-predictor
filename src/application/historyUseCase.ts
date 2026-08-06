/**
 * History application use case (spec prediction-history: persist a prediction
 * record, then reconcile stored records against the last finished matches of
 * the selected team). Repositories are injected (guía §12): a history store
 * and the fixtures port — the application layer never imports infrastructure.
 */
import { reconcileRecords } from '../domain/history/reconcile'
import type { Outcome1X2, PredictionRecord } from '../domain/football/model'
import type { HistoryRepository } from '../infrastructure/historyRepository'
import type { FixtureRepository } from './data/ports'

export type { HistoryRepository } from '../infrastructure/historyRepository'

export interface RecordPredictionInput {
  fixtureId: string
  home: string
  away: string
  kickoffUtc: string
  predictedOutcome: Outcome1X2
  /** Injectable clock so tests are deterministic (defaults to the real now). */
  now?: () => Date
}

export interface HistoryUseCases {
  readHistory(): PredictionRecord[]
  recordPrediction(input: RecordPredictionInput): PredictionRecord
  reconcileHistory(teamId: string): Promise<PredictionRecord[]>
}

export function createHistoryUseCases(repos: {
  history: HistoryRepository
  fixtures: FixtureRepository
}): HistoryUseCases {
  function recordPrediction(input: RecordPredictionInput): PredictionRecord {
    const createdAt = (input.now ?? (() => new Date()))().toISOString()
    const record: PredictionRecord = {
      fixtureId: input.fixtureId,
      home: input.home,
      away: input.away,
      kickoffUtc: input.kickoffUtc,
      predictedOutcome: input.predictedOutcome,
      model: 'poisson-elo-v1',
      createdAt,
      status: 'pending',
    }
    repos.history.upsert(record)
    return record
  }

  async function reconcileHistory(teamId: string): Promise<PredictionRecord[]> {
    const { results } = await repos.fixtures.getNextAndRecent(teamId)
    const reconciled = reconcileRecords(repos.history.readAll(), results)
    const persisted = reconciled.map((record) => {
      repos.history.upsert(record)
      return record
    })
    return persisted
  }

  return {
    recordPrediction,
    reconcileHistory,
    readHistory: () => repos.history.readAll(),
  }
}