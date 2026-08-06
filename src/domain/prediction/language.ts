/**
 * Spanish presentation helpers for the prediction (spec match-prediction:
 * "Natural-language Spanish outcome"). Pure string functions, no I/O, and raw
 * "1"/"X"/"2" notation is never emitted.
 */
import type { Outcome1X2 } from '../football/model'

/** Converts a probability fraction into a whole percentage for display. */
export function toPercentText(probability: number): string {
  return String(Math.round(probability * 100))
}

export interface OutcomeLabelInput {
  outcome: Outcome1X2
  homeName: string
  awayName: string
  probability: number
}

/**
 * Renders the outcome in natural Spanish: "Gana {team} ({pct}%)" or
 * "Empate ({pct}%)". A draw (including tie-within-tolerance resolved to 'X')
 * is always presented as "Empate", never as raw notation.
 */
export function formatOutcomeLabel(input: OutcomeLabelInput): string {
  const percent = toPercentText(input.probability)
  switch (input.outcome) {
    case '1':
      return `Gana ${input.homeName} (${percent}%)`
    case '2':
      return `Gana ${input.awayName} (${percent}%)`
    case 'X':
      return `Empate (${percent}%)`
  }
}

/** One-to-two-sentence Spanish rationale referencing only model factors. */
export function buildRationale(outcome: Outcome1X2): string {
  switch (outcome) {
    case '1':
      return 'El ataque local, la defensa rival y la ventaja de campo favorecen al equipo de casa.'
    case '2':
      return 'La superioridad ofensiva visitante y la defensa local dominan según el modelo.'
    case 'X':
      return 'Las fuerzas están equilibradas: el modelo espera un empate.'
  }
}