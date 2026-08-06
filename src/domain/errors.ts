/**
 * Typed domain errors with a stable `code` for the boundary to map to the
 * correct HTTP/UI response (guía §13). Never throw a generic Error.
 */

/** Discriminator used by the presentation layer to pick the right state. */
export type ErrorCode = 'VALIDATION_ERROR' | 'RATE_LIMIT_ERROR'

export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode

  /** `name` is preserved as the concrete class so catching by instance works. */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = new.target.name
  }
}

/** Raised when required inputs are missing or malformed. Fail fast, no fabrication. */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR' as const
}

/** Raised when the daily upstream call budget is exhausted. No upstream call is made. */
export class ApiRateLimitError extends DomainError {
  readonly code = 'RATE_LIMIT_ERROR' as const
}