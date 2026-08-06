import { describe, expect, it } from 'vitest'
import type { Outcome1X2 } from '../football/model'
import { formatOutcomeLabel } from './language'

describe('formatOutcomeLabel', () => {
  it('formats the home win in natural Spanish with the team name', () => {
    const label = formatOutcomeLabel({
      outcome: '1',
      homeName: 'Atlético Nacional',
      awayName: 'Millonarios',
      probability: 0.476,
    })
    expect(label).toBe('Gana Atlético Nacional (48%)')
  })

  it('formats the away win with the away team name', () => {
    const label = formatOutcomeLabel({
      outcome: '2',
      homeName: 'Atlético Nacional',
      awayName: 'Junior',
      probability: 0.334,
    })
    expect(label).toBe('Gana Junior (33%)')
  })

  it('formats the draw as Empate', () => {
    const label = formatOutcomeLabel({
      outcome: 'X',
      homeName: 'Atlético Nacional',
      awayName: 'Junior',
      probability: 0.19,
    })
    expect(label).toBe('Empate (19%)')
  })

  it('never leaks the raw 1X2 notation into any outcome label', () => {
    const outcomes: Outcome1X2[] = ['1', 'X', '2']
    for (const outcome of outcomes) {
      const label = formatOutcomeLabel({
        outcome,
        homeName: 'América',
        awayName: 'Cali',
        probability: 0.4,
      })
      expect(label).not.toBe('1')
      expect(label).not.toBe('X')
      expect(label).not.toBe('2')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})