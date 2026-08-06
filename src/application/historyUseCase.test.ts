/**
 * Unit tests for the history application use case (spec prediction-history:
 * persist a record when a prediction is made, then reconcile stored records
 * against the last finished reports of the selected team). Repositories are
 * injected (guía §12) so no localStorage or network runs here.
 */
import { describe, expect, it, vi } from 'vitest'
import type { FixtureRepository, NextAndRecent } from './data/ports'
import type { MatchResult, PredictionRecord } from '../domain/football/model'
import { createHistoryRepository, type HistoryRepository } from '../infrastructure/historyRepository'
import { createHistoryUseCases } from './historyUseCase'

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
}

function record(fixtureId: string, predictedOutcome: PredictionRecord['predictedOutcome']): PredictionRecord {
  return {
    fixtureId,
    home: 'Millonarios',
    away: 'Atlético Nacional',
    kickoffUtc: '2026-08-01T20:00:00Z',
    predictedOutcome,
    model: 'poisson-elo-v1',
    createdAt: '2026-08-01T21:00:00Z',
    status: 'pending',
  }
}

function stubFixtureRepo(feed: NextAndRecent): FixtureRepository {
  return { getNextAndRecent: vi.fn(async () => feed) }
}

function makeRepo(storage: Pick<Storage, 'getItem' | 'setItem'>): HistoryRepository {
  return createHistoryRepository({ storage })
}

describe('createHistoryUseCases', () => {
  it('recordPrediction persists a pending record with the model and createdAt set', () => {
    const storage = memoryStorage()
    const useCases = createHistoryUseCases({
      history: makeRepo(storage),
      fixtures: stubFixtureRepo({ next: null, results: [] }),
    })

    const saved = useCases.recordPrediction({
      fixtureId: 'f1',
      home: 'Millonarios',
      away: 'Atlético Nacional',
      kickoffUtc: '2026-08-01T20:00:00Z',
      predictedOutcome: '1',
      now: () => new Date('2026-08-01T21:00:00Z'),
    })

    expect(saved.status).toBe('pending')
    expect(saved.model).toBe('poisson-elo-v1')
    expect(saved.createdAt).toBe('2026-08-01T21:00:00.000Z')
    expect(useCases.readHistory()).toHaveLength(1)
  })

  it('recordPrediction updates an existing record for the same fixture instead of duplicating', () => {
    const repo = makeHistoryRepoWithRecords([record('f1', 'X')])
    const useCases = createHistoryUseCases({
      history: repo,
      fixtures: stubFixtureRepo({ next: null, results: [] }),
    })

    useCases.recordPrediction({
      fixtureId: 'f1',
      home: 'Millonarios',
      away: 'Atlético Nacional',
      kickoffUtc: '2026-08-01T20:00:00Z',
      predictedOutcome: '2',
      now: () => new Date('2026-08-01T22:00:00Z'),
    })

    const records = useCases.readHistory()
    expect(records).toHaveLength(1)
    expect(records[0]?.predictedOutcome).toBe('2')
  })

  it('reconcileHistory marks hits/misses against the selected team recent results', async () => {
    const repo = makeHistoryRepo()
    repo.upsert(record('f1', '1'))
    repo.upsert(record('f2', 'X'))
    const results: MatchResult[] = [
      { fixtureId: 'f1', kickoffUtc: '2026-08-01T20:00:00Z', homeGoals: 2, awayGoals: 1, outcome: '1' },
      { fixtureId: 'f2', kickoffUtc: '2026-08-02T20:00:00Z', homeGoals: 2, awayGoals: 1, outcome: '1' },
    ]
    const useCases = createHistoryUseCases({
      history: repo,
      fixtures: stubFixtureRepo({ next: null, results }),
    })

    const reconciled = await useCases.reconcileHistory('2893')
    expect(reconciled.map((r) => r.status)).toEqual(['hit', 'miss'])
  })

  it('reconcileHistory leaves everything pending when the team has no finished results', async () => {
    const repo = makeHistoryRepo()
    repo.upsert(record('f1', '1'))
    const useCases = createHistoryUseCases({
      history: repo,
      fixtures: stubFixtureRepo({ next: null, results: [] }),
    })

    const reconciled = await useCases.reconcileHistory('2893')
    expect(reconciled.map((r) => r.status)).toEqual(['pending'])
  })
})

function makeHistoryRepo(): HistoryRepository {
  return createHistoryRepository({ storage: memoryStorage() })
}

function makeHistoryRepoWithRecords(records: PredictionRecord[]): HistoryRepository {
  const storage = new LocalBacking(records)
  return createHistoryRepository({ storage })
}

class LocalBacking implements Pick<Storage, 'getItem' | 'setItem'> {
  private value: string | null
  constructor(records: PredictionRecord[]) {
    this.value = JSON.stringify(records)
  }
  getItem(): string | null {
    return this.value
  }
  setItem(_key: string, value: string): void {
    this.value = value
  }
}