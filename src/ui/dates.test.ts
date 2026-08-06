/**
 * Pure Spanish date formatting for the fixture card (spec fixtures-data: the
 * kickoff datetime must be presented in Spanish). Deterministic: always UTC,
 * no locale-dependent formatting so tests are stable in any environment.
 */
import { describe, expect, it } from 'vitest'
import { formatKickoffSpanish } from './dates'

describe('formatKickoffSpanish', () => {
  it('formats an evening kickoff with weekday, day, month and time', () => {
    expect(formatKickoffSpanish('2026-08-15T22:00:00Z')).toBe(
      'sábado, 15 de agosto · 22:00',
    )
  })

  it('keeps UTC even across local timezone offsets', () => {
    expect(formatKickoffSpanish('2026-08-16T00:30:00Z')).toBe(
      'domingo, 16 de agosto · 00:30',
    )
  })

  it('formats a January kickoff with the Spanish month name', () => {
    expect(formatKickoffSpanish('2026-01-03T20:00:00Z')).toBe(
      'sábado, 3 de enero · 20:00',
    )
  })
})
