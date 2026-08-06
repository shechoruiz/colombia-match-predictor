/**
 * Unit tests for the pure history reconciliation (spec prediction-history:
 * hit = predicted 1X2 equals the real full-time outcome; pending when the
 * fixture is not among the last-5 FINISHED results; out-of-window and pending
 * never count toward the aggregate). Pure and deterministic — no mocks needed.
 */
import { describe, expect, it } from 'vitest'
import type { MatchResult, PredictionRecord } from '../football/model'
import { RECONCILE_WINDOW_SIZE, countHistory, reconcileRecords } from './reconcile'

function record(
  fixtureId: string,
  predictedOutcome: PredictionRecord['predictedOutcome'],
): PredictionRecord {
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

function result(
  fixtureId: string,
  outcome: MatchResult['outcome'],
  kickoffUtc = '2026-08-01T20:00:00Z',
): MatchResult {
  return { fixtureId, homeGoals: 2, awayGoals: 1, outcome, kickoffUtc }
}

describe('reconcileRecords', () => {
  it('marks a record hit when the predicted 1X2 equals the real full-time outcome', () => {
    const reconciled = reconcileRecords([record('f1', '1')], [result('f1', '1')])
    expect(reconciled[0]?.status).toBe('hit')
  })

  it('marks a record miss when the predicted 1X2 differs from the real outcome', () => {
    const reconciled = reconcileRecords([record('f1', 'X')], [result('f1', '1')])
    expect(reconciled[0]?.status).toBe('miss')
  })

  it('keeps a record pending when its fixture is not among the results', () => {
    const reconciled = reconcileRecords([record('f1', '1')], [result('f9', '2')])
    expect(reconciled[0]?.status).toBe('pending')
  })

  it('marks everything pending when the feed has no finished matches', () => {
    const reconciled = reconcileRecords([record('f1', '1'), record('f2', 'X')], [])
    expect(reconciled.map((r) => r.status)).toEqual(['pending', 'pending'])
  })

  it('treats out-of-window results (past the last RECONCILE_WINDOW_SIZE) as pending', () => {
    const manyResults = Array.from({ length: RECONCILE_WINDOW_SIZE + 3 }, (_, i) =>
      result(`f${i}`, '1'),
    )
    const outOfWindow = reconcileRecords([record('f0', '1')], manyResults)
    expect(outOfWindow[0]?.status).toBe('pending')
  })

  it('only reconciles the last RECONCILE_WINDOW_SIZE finished results', () => {
    const results = [
      result('f100', 'X'),
      result('f99', '1'),
      result('f98', '2'),
      result('f97', '1'),
      result('f96', '1'),
    ]
    const reconciled = reconcileRecords(
      [record('f100', 'X'), record('f98', '2'), record('f95', '1')],
      results,
    )
    expect(reconciled.map((r) => r.status)).toEqual(['hit', 'hit', 'pending'])
  })

  it('normalizes a newest-first feed: window is the 5 most recent by kickoffUtc', () => {
    const newestFirst = [
      result('f6', '1', '2026-08-06T20:00:00Z'),
      result('f5', '1', '2026-08-05T20:00:00Z'),
      result('f4', '2', '2026-08-04T20:00:00Z'),
      result('f3', 'X', '2026-08-03T20:00:00Z'),
      result('f2', '1', '2026-08-02T20:00:00Z'),
      result('f1', '2', '2026-08-01T20:00:00Z'),
      result('f0', '1', '2026-07-31T20:00:00Z'),
    ]
    const reconciled = reconcileRecords([record('f0', '1'), record('f2', '1'), record('f1', '2')], newestFirst)
    expect(reconciled.map((r) => r.status)).toEqual(['pending', 'hit', 'pending'])
  })
})

describe('countHistory', () => {
  it('sums hits, misses and pending separately', () => {
    const records = [
      { ...record('a', '1'), status: 'hit' as const },
      { ...record('b', 'X'), status: 'miss' as const },
      { ...record('c', '2'), status: 'pending' as const },
    ]
    const summary = countHistory(records)
    expect(summary.hits).toBe(1)
    expect(summary.misses).toBe(1)
    expect(summary.pending).toBe(1)
    expect(summary.window).toBe(2)
  })

  it('excludes pending records from the aggregate window', () => {
    const records = [
      { ...record('a', '1'), status: 'hit' as const },
      { ...record('b', '2'), status: 'pending' as const },
    ]
    expect(countHistory(records).window).toBe(1)
  })

  it('reports an empty summary when there are no resolved records', () => {
    const records = [{ ...record('a', '1'), status: 'pending' as const }]
    const summary = countHistory(records)
    expect(summary).toEqual({ hits: 0, misses: 0, pending: 1, window: 0 })
  })
})