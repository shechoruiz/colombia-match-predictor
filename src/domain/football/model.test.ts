import { describe, expect, it } from 'vitest'
import { isFixtureStatus, isHistoryStatus, isOutcome1X2 } from './model'

describe('isOutcome1X2', () => {
  it('accepts each of the three valid 1X2 literals', () => {
    expect(isOutcome1X2('1')).toBe(true)
    expect(isOutcome1X2('X')).toBe(true)
    expect(isOutcome1X2('2')).toBe(true)
  })

  it('rejects values outside the literal union', () => {
    expect(isOutcome1X2('H')).toBe(false)
    expect(isOutcome1X2(1)).toBe(false)
    expect(isOutcome1X2(null)).toBe(false)
    expect(isOutcome1X2({})).toBe(false)
  })
})

describe('isFixtureStatus', () => {
  it('accepts every status the design allows', () => {
    expect(isFixtureStatus('SCHEDULED')).toBe(true)
    expect(isFixtureStatus('TIMED')).toBe(true)
    expect(isFixtureStatus('IN_PLAY')).toBe(true)
    expect(isFixtureStatus('FINISHED')).toBe(true)
  })

  it('rejects unknown or malformed statuses', () => {
    expect(isFixtureStatus('POSTPONED')).toBe(false)
    expect(isFixtureStatus('finished')).toBe(false)
    expect(isFixtureStatus('')).toBe(false)
    expect(isFixtureStatus(undefined)).toBe(false)
  })
})

describe('isHistoryStatus', () => {
  it('accepts the three reconciliation statuses', () => {
    expect(isHistoryStatus('pending')).toBe(true)
    expect(isHistoryStatus('hit')).toBe(true)
    expect(isHistoryStatus('miss')).toBe(true)
  })

  it('rejects values outside pending|hit|miss', () => {
    expect(isHistoryStatus('draw')).toBe(false)
    expect(isHistoryStatus('PENDING')).toBe(false)
    expect(isHistoryStatus('1')).toBe(false)
  })
})
