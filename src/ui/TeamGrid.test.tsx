/**
 * Component tests for TeamGrid/TeamCard (spec fixtures-data: responsive grid
 * with crest + name; loading/error/empty states). Pure presentational props —
 * no network in these components; the parent wires the hook.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Team } from '../domain/football/model'
import { TeamCard } from './TeamCard'
import { TeamGrid, type TeamGridProps } from './TeamGrid'

const TEAMS: Team[] = [
  { id: '2893', name: 'Atlético Nacional', crestUrl: 'https://c.com/an.png' },
  { id: '2900', name: 'Millonarios', crestUrl: null },
]

function renderGrid(props?: Partial<TeamGridProps>): void {
  render(
    <TeamGrid
      teams={TEAMS}
      isLoading={false}
      isError={false}
      onRetry={vi.fn()}
      onSelect={vi.fn()}
      {...props}
    />,
  )
}

describe('TeamGrid', () => {
  it('renders each team crest cell with name', () => {
    renderGrid()
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByText('Atlético Nacional')).toBeInTheDocument()
    expect(screen.getByText('Millonarios')).toBeInTheDocument()
    expect(screen.getByAltText('Escudo de Atlético Nacional')).toBeInTheDocument()
  })

  it('falls back to a placeholder when crestUrl is missing', () => {
    renderGrid()
    expect(screen.getByLabelText('Escudo no disponible')).toBeInTheDocument()
  })

  it('shows a loading skeleton while fetching', () => {
    renderGrid({ isLoading: true, teams: null })
    expect(screen.getByLabelText('Cargando equipos')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows an error state with retry action', async () => {
    const onRetry = vi.fn()
    renderGrid({ isError: true, teams: null, onRetry })
    const retry = screen.getByRole('button', { name: 'Reintentar' })
    await userEvent.click(retry)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state when no teams are available', () => {
    renderGrid({ teams: [] })
    expect(screen.getByText('No hay equipos disponibles.')).toBeInTheDocument()
  })

  it('notifies the parent when a team is selected', async () => {
    const onSelect = vi.fn()
    renderGrid({ onSelect })
    await userEvent.click(screen.getByRole('button', { name: /Atlético Nacional/ }))
    expect(onSelect).toHaveBeenCalledWith('2893')
  })
})

describe('TeamCard', () => {
  it('renders the crest as an image when provided', () => {
    render(<TeamCard team={TEAMS[0]!} onSelect={vi.fn()} />)
    expect(screen.getByAltText('Escudo de Atlético Nacional')).toHaveAttribute(
      'src',
      'https://c.com/an.png',
    )
    expect(screen.getByRole('button', { name: /Atlético Nacional/ })).toBeInTheDocument()
  })
})