import { describe, expect, it } from 'vitest'
import { ApiError, ApiRateLimitError, DomainError, ValidationError } from './errors'

describe('DomainError hierarchy', () => {
  it('ValidationError is a DomainError with its typed code', () => {
    const error = new ValidationError('missing home strengths')
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('missing home strengths')
    expect(error.name).toBe('ValidationError')
  })

  it('ApiRateLimitError is a DomainError with its typed code', () => {
    const error = new ApiRateLimitError('daily request limit reached')
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('RATE_LIMIT_ERROR')
    expect(error.name).toBe('ApiRateLimitError')
  })

  it('ApiError is a DomainError with its typed code', () => {
    const error = new ApiError('upstream request failed')
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('API_ERROR')
    expect(error.name).toBe('ApiError')
  })
})
