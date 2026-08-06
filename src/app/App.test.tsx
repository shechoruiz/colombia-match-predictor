/**
 * Component test for the App composition root (design: grid→select→panel via
 * TanStack Query + Zustand). Uses a QueryClientProvider and an injected set of
 * use cases; verifies the end-to-end flow the user sees.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import type { FootballUseCases } from '../application/useCases'
import type { Team } from '../domain/football/model'

const TEAMS: Team[] = [
  { id: '2893', name: 'Atlético Nacional', crestUrl: null },
  { id: '2900', name: 'Millonarios', crestUrl: null },
]

function createUseCases(overrides?: Partial<FootballUseCases>): FootballUseCases {
  return {
    getTeamCatalog: vi.fn(async () => TEAMS),
    getNextFixture: vi.fn(async () => ({
      id: '6101',
      home: 'Millonarios',
      away: 'Atlético Nacional',
      kickoffUtc: '2026-08-15T22:00:00Z',
      status: 'SCHEDULED' as const,
    })),
    getRecentResults: vi.fn(async () => [
      { fixtureId: '6001', homeGoals: 3, awayGoals: 1, outcome: '1' as const },
      { fixtureId: '6002', homeGoals: 2, awayGoals: 0, outcome: '1' as const },
    ]),
    ...overrides,
  }
}

function renderApp(useCases: FootballUseCases): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <App useCases={useCases} />
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('renders the team grid and an empty prediction before any selection', async () => {
    renderApp(createUseCases())
    await waitFor(() => expect(screen.getByText('Atlético Nacional')).toBeInTheDocument())
    expect(
      screen.getByText('Selecciona un equipo para ver su predicción.'),
    ).toBeInTheDocument()
  })

  it('shows the next match + prediction after selecting a team', async () => {
    renderApp(createUseCases())
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Atlético Nacional/ }))

    expect(await screen.findByText('Millonarios')).toBeInTheDocument()
    expect(await screen.findByText(/sábado, 15 de agosto/)).toBeInTheDocument()
    expect(await screen.findByText(/Marcador:/)).toBeInTheDocument()
    expect(screen.getByText(/Gana /)).toBeInTheDocument()
  })

  it('shows the grid error and retries when the catalog fails', async () => {
    const getTeamCatalog = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(TEAMS)
    const useCases = createUseCases({ getTeamCatalog })
    renderApp(useCases)

    expect(
      await screen.findByText('No se pudo cargar el catálogo de equipos.'),
    ).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Atlético Nacional')).toBeInTheDocument()
  })
})