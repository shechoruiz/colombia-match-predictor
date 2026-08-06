/**
 * Environment configuration for upstream adapters.
 *
 * Keys are read ONLY from process.env under NON-VITE_ names (`API_FOOTBALL_KEY`,
 * `THESPORTSDB_KEY`) so Vite never injects them into the public bundle (key
 * hygiene requirement). In the browser `process` is undefined, so the adapters
 * receive no key here and the DI layer falls back to the mock source.
 */
export interface ApiConfig {
  apiFootballKey: string | undefined
  theSportsDbKey: string | undefined
}

export function loadApiConfig(): ApiConfig {
  return {
    apiFootballKey: readEnvValue('API_FOOTBALL_KEY'),
    theSportsDbKey: readEnvValue('THESPORTSDB_KEY'),
  }
}

function readEnvValue(name: string): string | undefined {
  if (typeof process === 'undefined') return undefined
  const value = process.env[name]
  return value === '' ? undefined : value
}