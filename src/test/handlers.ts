/**
 * MSW request handlers and payload fixtures for adapter integration tests.
 * Covers the API-Football endpoints used by the repositories (success) plus
 * TheSportsDB crest lookup. Error/malformed variants are added per-test via
 * `server.use(...)`.
 */
import { http, HttpResponse } from 'msw'

export const API_FOOTBALL_URL = 'https://v3.football.api-sports.io'

export const teamsPayload = {
  response: [
    { team: { id: 2893, name: 'Atlético Nacional', logo: 'https://c.com/an.png' } },
    { team: { id: 2900, name: 'Millonarios', logo: 'https://c.com/mil.png' } },
  ],
}

export const fixturesPayload = {
  response: [
    {
      fixture: { id: 1001, date: '2026-08-10T20:00:00Z', status: { short: 'FT' } },
      teams: { home: { name: 'A' }, away: { name: 'B' } },
      goals: { home: 2, away: 1 },
    },
    {
      fixture: { id: 1002, date: '2026-08-16T22:00:00Z', status: { short: 'NS' } },
      teams: { home: { name: 'B' }, away: { name: 'A' } },
      goals: { home: null, away: null },
    },
  ],
}

/** All FINISHED fixtures → a team with no upcoming match (empty next state). */
export const finishedOnlyPayload = {
  response: [
    {
      fixture: { id: 1001, date: '2026-08-10T20:00:00Z', status: { short: 'FT' } },
      teams: { home: { name: 'A' }, away: { name: 'B' } },
      goals: { home: 2, away: 1 },
    },
    {
      fixture: { id: 1002, date: '2026-08-09T20:00:00Z', status: { short: 'FT' } },
      teams: { home: { name: 'B' }, away: { name: 'A' } },
      goals: { home: 0, away: 0 },
    },
  ],
}

/** All not-started fixtures → team with no FINISHED results (empty results state). */
export const scheduledOnlyPayload = {
  response: [
    {
      fixture: { id: 2002, date: '2026-08-16T22:00:00Z', status: { short: 'NS' } },
      teams: { home: { name: 'B' }, away: { name: 'A' } },
      goals: { home: null, away: null },
    },
  ],
}

export const THESPORTSDB_SEARCH_URL = 'https://www.thesportsdb.com/api/v1/json/:key/searchteams.php'
const theSportsDbPayload = { teams: [{ idTeam: '1', strTeamBadge: 'https://c.com/an-badge.png' }] }

export const handlers = [
  http.get(`${API_FOOTBALL_URL}/teams`, () => HttpResponse.json(teamsPayload)),
  http.get(`${API_FOOTBALL_URL}/fixtures`, () => HttpResponse.json(fixturesPayload)),
  http.get(THESPORTSDB_SEARCH_URL, () => HttpResponse.json(theSportsDbPayload)),
]