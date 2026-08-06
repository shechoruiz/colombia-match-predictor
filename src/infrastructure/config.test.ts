import { afterEach, describe, expect, it } from 'vitest'
import { loadApiConfig } from './config'

describe('loadApiConfig', () => {
  afterEach(() => {
    delete process.env.API_FOOTBALL_KEY
    delete process.env.THESPORTSDB_KEY
  })

  it('reads the non-VITE key names from the environment', () => {
    process.env.API_FOOTBALL_KEY = 'abc'
    process.env.THESPORTSDB_KEY = 'xyz'
    expect(loadApiConfig()).toEqual({ apiFootballKey: 'abc', theSportsDbKey: 'xyz' })
  })

  it('treats a blank key as not configured', () => {
    process.env.API_FOOTBALL_KEY = ''
    expect(loadApiConfig().apiFootballKey).toBeUndefined()
  })

  it('returns undefined keys when nothing is set', () => {
    expect(loadApiConfig()).toEqual({ apiFootballKey: undefined, theSportsDbKey: undefined })
  })
})