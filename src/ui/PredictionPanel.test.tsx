/**
 * Component tests for PredictionPanel (spec match-prediction: probability
 * bars, scoreline, natural Spanish outcome + rationale; loading/error/empty).
 * Pure presentational props — the hook computes and hands in the prediction.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Prediction } from '../domain/football/model'
import { PredictionPanel, type PredictionPanelProps } from './PredictionPanel'

const PREDICTION: Prediction = {
  probabilities: { home: 0.48, draw: 0.27, away: 0.25 },
  predictedScore: { home: 2, away: 1 },
  outcome: '1',
  rationale: 'El ataque local favorece al equipo de casa.',
}

function renderPanel(props: Partial<PredictionPanelProps> = {}): void {
  render(
    <PredictionPanel
      prediction={null}
      homeName="Millonarios"
      awayName="Atlético Nacional"
      isLoading={false}
      isError={false}
      onRetry={vi.fn()}
      {...props}
    />,
  )
}

describe('PredictionPanel', () => {
  it('renders the natural Spanish outcome with the scoreline and rationale', () => {
    renderPanel({ prediction: PREDICTION })
    expect(screen.getByText('Gana Millonarios (48%)')).toBeInTheDocument()
    expect(screen.getByText('Marcador: 2 - 1')).toBeInTheDocument()
    expect(screen.getByText(PREDICTION.rationale)).toBeInTheDocument()
  })

  it('renders probability bars with an accessible value for each outcome', () => {
    renderPanel({ prediction: PREDICTION })
    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(3)
    expect(screen.getByLabelText('Probabilidad local 48%')).toHaveAttribute('aria-valuenow', '48')
    expect(screen.getByLabelText('Probabilidad empate 27%')).toHaveAttribute('aria-valuenow', '27')
    expect(screen.getByLabelText('Probabilidad visitante 25%')).toHaveAttribute('aria-valuenow', '25')
  })

  it('shows a loading skeleton while the prediction is pending', () => {
    renderPanel({ isLoading: true })
    expect(screen.getByLabelText('Calculando predicción')).toBeInTheDocument()
  })

  it('shows an error state with retry action', async () => {
    const onRetry = vi.fn()
    renderPanel({ isError: true, onRetry })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state when there is no prediction', () => {
    renderPanel({ prediction: null })
    expect(screen.getByText('Selecciona un equipo para ver su predicción.')).toBeInTheDocument()
  })
})