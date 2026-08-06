/**
 * Unit tests for the localStorage-backed history repository (spec
 * prediction-history: persist on write, restore on reload, dedupe by fixture
 * identity, corrupt storage ignored safely). Storage is injected so tests run
 * with an in-memory map instead of a browser.
 */
import { describe, expect, it } from 'vitest'
import type { PredictionRecord } from '../domain/football/model'
import { createHistoryRepository } from './historyRepository'

function record(fixtureId: string, overrides: Partial<PredictionRecord> = {}): PredictionRecord {
  return {
    fixtureId,
    home: 'Millonarios',
    away: 'Atlético Nacional',
    kickoffUtc: '2026-08-01T20:00:00Z',
    predictedOutcome: '1',
    model: 'poisson-elo-v1',
    createdAt: '2026-08-01T21:00:00Z',
    status: 'pending',
    ...overrides,
  }
}

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  }
}

describe('createHistoryRepository', () => {
  it('persists a record and restores it on a fresh instance over the same storage', () => {
    const storage = memoryStorage()
    const writer = createHistoryRepository({ storage })
    writer.upsert(record('f1'))

    const reader = createHistoryRepository({ storage })
    expect(reader.readAll()).toEqual([record('f1')])
  })

  it('updates instead of duplicating when the same fixture is upserted twice', () => {
    const storage = memoryStorage()
    const repo = createHistoryRepository({ storage })
    repo.upsert(record('f1', { predictedOutcome: 'X' }))
    repo.upsert(record('f1', { predictedOutcome: '2' }))

    const restored = repo.readAll()
    expect(restored).toHaveLength(1)
    expect(restored[0]?.predictedOutcome).toBe('2')
  })

  it('keeps records of different fixtures separate', () => {
    const storage = memoryStorage()
    const repo = createHistoryRepository({ storage })
    repo.upsert(record('f1'))
    repo.upsert(record('f2'))

    expect(repo.readAll().map((r) => r.fixtureId)).toEqual(['f1', 'f2'])
  })

  it('returns an empty list when storage holds invalid JSON instead of crashing', () => {
    const storage = memoryStorage()
    storage.setItem('predictionHistory', '{not valid json!!')
    const repo = createHistoryRepository({ storage })
    expect(repo.readAll()).toEqual([])
  })

  it('drops corrupt entries but still restores the valid ones', () => {
    const storage = memoryStorage()
    storage.setItem(
      'predictionHistory',
      JSON.stringify([
        record('f1'),
        { fixtureId: 42, nonsense: true },
        { fixtureId: 'f2', home: 1 },
        record('f3', { predictedOutcome: '2' }),
      ]),
    )
    const repo = createHistoryRepository({ storage })
    expect(repo.readAll().map((r) => r.fixtureId)).toEqual(['f1', 'f3'])
  })

  it('returns an empty list when nothing is stored yet', () => {
    const repo = createHistoryRepository({ storage: memoryStorage() })
    expect(repo.readAll()).toEqual([])
  })
})