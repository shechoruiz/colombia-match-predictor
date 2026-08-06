/**
 * Pure Spanish date formatting for the fixture card (spec fixtures-data: the
 * kickoff datetime must be presented in Spanish). Deterministic: always UTC,
 * no locale-dependent formatting so tests are stable in any environment.
 */

const WEEKDAYS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

/** Renders an ISO kickoff as "sábado, 15 de agosto · 22:00" (UTC, Spanish). */
export function formatKickoffSpanish(kickoffUtc: string): string {
  const date = new Date(kickoffUtc)
  const weekday = WEEKDAYS[date.getUTCDay()]
  const month = MONTHS[date.getUTCMonth()]
  if (weekday === undefined || month === undefined) {
    return kickoffUtc
  }
  const day = date.getUTCDate()
  const time = `${padTwoDigits(date.getUTCHours())}:${padTwoDigits(date.getUTCMinutes())}`
  return `${weekday}, ${day} de ${month} · ${time}`
}