/**
 * Composition root: selects the data source once at startup (design D6 + spec
 * "Mock/dev source switchable"). Key configured → API-Football (cache-first +
 * daily budget guard); otherwise → key-less mock. The UI layer depends only on
 * the application use cases, so swapping sources never touches it.
 */
import { createFootballUseCases, type FootballUseCases } from '../application/useCases'
import { createApiFootballClient } from '../infrastructure/api-football/client'
import { createCachedFootballRepository } from '../infrastructure/api-football/cachedRepository'
import { createApiFootballRepository } from '../infrastructure/api-football/repositories'
import { createDailyBudget, type DailyBudget } from '../infrastructure/cache/dailyBudget'
import { createTtlCache } from '../infrastructure/cache/ttlCache'
import { loadApiConfig, type ApiConfig } from '../infrastructure/config'
import { createMockSource } from '../infrastructure/mock/source'

export type DataSourceKind = 'api-football' | 'mock'

/** Pure decision factor kept separate so the key→source rule is unit-testable. */
export function selectDataSourceKind(config: ApiConfig): DataSourceKind {
  return config.apiFootballKey === undefined ? 'mock' : 'api-football'
}

export interface AppDataSources {
  kind: DataSourceKind
  useCases: FootballUseCases
}

export function createDataSources(config: ApiConfig = loadApiConfig()): AppDataSources {
  if (selectDataSourceKind(config) === 'api-football') {
    return createApiFootballSources(config)
  }
  const mock = createMockSource()
  return {
    kind: 'mock',
    useCases: createFootballUseCases({ teams: mock.teams, fixtures: mock.fixtures }),
  }
}

function createApiFootballSources(config: ApiConfig): AppDataSources {
  const client = createApiFootballClient(config)
  const source = createApiFootballRepository(client)
  const cached = createCachedFootballRepository(source, createTtlCache(), defaultDailyBudget())
  return {
    kind: 'api-football',
    useCases: createFootballUseCases({ teams: cached, fixtures: cached }),
  }
}

function defaultDailyBudget(): DailyBudget {
  return createDailyBudget({ storage: localStorage })
}