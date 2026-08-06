import { describe, expect, it } from 'vitest'
import { ValidationError } from '../../domain/errors'
import { parseFixturesResponse, parseTeamsResponse } from './schemas'

describe('parseTeamsResponse', () => {
  it('accepts a well-formed teams payload and returns the catalog', () => {
    const teams = parseTeamsResponse({
      response: [{ team: { id: 2893, name: 'Atlético Nacional', logo: 'https://x/an.png' } }],
    })
    expect(teams).toHaveLength(1)
    expect(teams[0]?.team.name).toBe('Atlético Nacional')
    expect(teams[0]?.team.logo).toBe('https://x/an.png')
  })

  it('rejects a team entry missing its name', () => {
    expect(() => parseTeamsResponse({ response: [{ team: { id: 1, logo: 'x' } }] })).toThrow(ValidationError)
  })

  it('rejects a payload without a response array', () => {
    expect(() => parseTeamsResponse({ results: [] })).toThrow(ValidationError)
  })
})

describe('parseFixturesResponse', () => {
  const validItem = {
    fixture: { id: 1001, date: '2026-08-10T20:00:00Z', status: { short: 'FT' } },
    teams: { home: { name: 'A' }, away: { name: 'B' } },
    goals: { home: 2, away: 1 },
  }

  it('accepts a well-formed fixtures payload', () => {
    const items = parseFixturesResponse({ response: [validItem] })
    expect(items).toHaveLength(1)
    expect(items[0]?.fixture.id).toBe(1001)
    expect(items[0]?.goals.home).toBe(2)
  })

  it('rejects a fixture whose goals are strings instead of numbers', () => {
    const invalid = { ...validItem, goals: { home: '2', away: 1 } }
    expect(() => parseFixturesResponse({ response: [invalid] })).toThrow(ValidationError)
  })

  it('rejects a payload with no response key', () => {
    expect(() => parseFixturesResponse({ data: [] })).toThrow(ValidationError)
  })
})