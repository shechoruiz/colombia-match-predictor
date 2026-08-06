/**
 * Zod boundary schemas for API-Football responses (guía §11: validate at the
 * edge, fail fast with a typed error that surfaces as an error state — raw wire
 * data never enters domain logic).
 */
import { z } from 'zod'
import { ValidationError } from '../../domain/errors'

const teamItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string(),
})

export const teamsResponseSchema = z.object({
  response: z.array(z.object({ team: teamItemSchema })),
})

export type TeamEntryApi = z.infer<typeof teamsResponseSchema>['response'][number]

const fixtureItemSchema = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    status: z.object({ short: z.string() }),
  }),
  teams: z.object({
    home: z.object({ name: z.string() }),
    away: z.object({ name: z.string() }),
  }),
  goals: z.object({
    home: z.number().nullable(),
    away: z.number().nullable(),
  }),
})

export const fixturesResponseSchema = z.object({
  response: z.array(fixtureItemSchema),
})

export type FixtureApiItem = z.infer<typeof fixturesResponseSchema>['response'][number]

function parseResponse<S extends z.ZodType<unknown, unknown>>(source: string, raw: unknown, schema: S): z.output<S> {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join('; ')
    throw new ValidationError(`${source} response rejected: ${detail}`)
  }
  return parsed.data
}

export function parseTeamsResponse(raw: unknown): TeamEntryApi[] {
  return parseResponse('teams', raw, teamsResponseSchema).response
}

export function parseFixturesResponse(raw: unknown): FixtureApiItem[] {
  return parseResponse('fixtures', raw, fixturesResponseSchema).response
}