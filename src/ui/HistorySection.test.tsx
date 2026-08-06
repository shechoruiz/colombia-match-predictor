/**
 * Component tests for HistorySection (spec prediction-history: hit/miss/pending
 * badges, aggregate H/(H+M) with pending excluded, loading/error/empty states).
 * Pure presentational props — the hook hands in records and the summary.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PredictionRecord } from '../domain/football/model'
import { HistorySection, type HistorySectionProps } from './HistorySection'

function record(fixtureId: string, status: PredictionRecord['status']): PredictionRecord {
  return {
    fixtureId,
    home: 'Millonarios',
    away: 'Atlético Nacional',
    kickoffUtc: '2026-08-01T20:00:00Z',
    predictedOutcome: '1',
    model: 'poisson-elo-v1',
    createdAt: '2026-08-01T21:00:00Z',
    status,
  }
}

function renderSection(props: Partial<HistorySectionProps> = {}): void {
  render(
    <HistorySection
      records={[]}
      summary={{ hits: 0, misses: 0, pending: 0, window: 0 }}
      isLoading={false}
      isError={false}
      onRetry={vi.fn()}
      {...props}
    />,
  )
}

describe('HistorySection', () => {
  it('shows the aggregate as H/(H+M) excluding pending records', () => {
    renderSection({
      records: [record('a', 'hit'), record('b', 'miss'), record('c', 'hit'), record('d', 'pending')],
      summary: { hits: 2, misses: 1, pending: 1, window: 3 },
    })
    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByText(/acertadas/)).toBeInTheDocument()
  })

  it('renders a hit badge, a miss badge and a pending badge for the records', () => {
    renderSection({
      records: [record('a', 'hit'), record('b', 'miss'), record('c', 'pending')],
      summary: { hits: 1, misses: 1, pending: 1, window: 2 },
    })
    expect(screen.getByText('Acertada')).toBeInTheDocument()
    expect(screen.getByText('Fallada')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('shows a loading skeleton while history is reconciling', () => {
    renderSection({ isLoading: true })
    expect(screen.getByLabelText('Cargando historial')).toBeInTheDocument()
  })

  it('shows an error state with retry action', async () => {
    const onRetry = vi.fn()
    renderSection({ isError: true, onRetry })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state inviting the first prediction', () => {
    renderSection()
    expect(screen.getByText(/haz tu primera predicción/i)).toBeInTheDocument()
  })
})