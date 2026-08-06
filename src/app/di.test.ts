import { describe, expect, it } from 'vitest'
import { createDataSources, selectDataSourceKind } from './di'

describe('selectDataSourceKind', () => {
  it('selects the mock source when no API-Football key is configured', () => {
    expect(selectDataSourceKind({ apiFootballKey: undefined, theSportsDbKey: undefined })).toBe('mock')
  })

  it('selects API-Football when a key is configured', () => {
    expect(selectDataSourceKind({ apiFootballKey: 'test-key', theSportsDbKey: undefined })).toBe('api-football')
  })
})

describe('createDataSources', () => {
  it('composes a mock-backed source that serves the team catalog without a key', async () => {
    const sources = createDataSources({ apiFootballKey: undefined, theSportsDbKey: undefined })

    expect(sources.kind).toBe('mock')

    const teams = await sources.useCases.getTeamCatalog()
    expect(teams.length).toBeGreaterThan(0)
    expect(teams.map((team) => team.name).slice(0, 2)).toEqual(['América de Cali', 'Atlético Nacional'])
  })

  it('composes an API-Football-backed source when a key is configured (MSW intercepts)', async () => {
    const sources = createDataSources({ apiFootballKey: 'test-key', theSportsDbKey: undefined })

    expect(sources.kind).toBe('api-football')

    const teams = await sources.useCases.getTeamCatalog()
    expect(teams.map((team) => team.name)).toEqual(['Atlético Nacional', 'Millonarios'])
  })
})