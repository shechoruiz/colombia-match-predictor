/**
 * Component tests for NextMatchCard (spec fixtures-data: next fixture with
 * team names + Spanish kickoff; explicit empty state when no fixture). Pure
 * presentational props, no data fetching inside.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Fixture } from '../domain/football/model'
import { NextMatchCard, type NextMatchCardProps } from './NextMatchCard'

const FIXTURE: Fixture = {
  id: '6101',
  home: 'Millonarios',
  away: 'Atlético Nacional',
  kickoffUtc: '2026-08-15T22:00:00Z',
  status: 'SCHEDULED',
}

function renderCard(props: Partial<NextMatchCardProps> = {}): void {
  render(
    <NextMatchCard
      fixture={null}
      isLoading={false}
      isError={false}
      onRetry={vi.fn()}
      {...props}
    />,
  )
}

describe('NextMatchCard', () => {
  it('shows the home and away teams with the Spanish kickoff', () => {
    renderCard({ fixture: FIXTURE })
    expect(screen.getByText(/Millonarios/)).toBeInTheDocument()
    expect(screen.getByText(/Atlético Nacional/)).toBeInTheDocument()
    expect(screen.getByText('sábado, 15 de agosto · 22:00')).toBeInTheDocument()
  })

  it('shows a loading skeleton while fetching the fixture', () => {
    renderCard({ isLoading: true })
    expect(screen.getByLabelText('Cargando próximo partido')).toBeInTheDocument()
  })

  it('shows an error state with retry action', async () => {
    const onRetry = vi.fn()
    renderCard({ isError: true, onRetry })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state when there is no upcoming fixture', () => {
    renderCard({ fixture: null })
    expect(screen.getByText('Sin próximo partido programado.')).toBeInTheDocument()
  })
})