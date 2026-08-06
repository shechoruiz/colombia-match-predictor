/**
 * Daily upstream request budget backed by localStorage (design D5). Fails fast
 * when fewer than `minRemaining` calls are left so the app stops calling
 * upstream before hitting the provider's hard cap. Storage is injected so
 * tests run without a real browser.
 */
import { ApiRateLimitError } from '../../domain/errors'

export interface DailyBudget {
  remaining(): number
  consume(): void
  /** Throws ApiRateLimitError when fewer than `minRemaining` calls are left. */
  assertAvailable(): void
}

export interface DailyBudgetOptions {
  storage: Pick<Storage, 'getItem' | 'setItem'>
  maxPerDay?: number
  minRemaining?: number
  now?: () => Date
}

function budgetKey(day: Date): string {
  return `apiFootballBudget:${day.toISOString().slice(0, 10)}`
}

export function createDailyBudget(options: DailyBudgetOptions): DailyBudget {
  const { storage, maxPerDay = 100, minRemaining = 5, now = () => new Date() } = options

  function readCount(): number {
    const raw = storage.getItem(budgetKey(now()))
    if (raw === null) return 0
    const parsed = Number.parseInt(raw, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  function writeCount(count: number): void {
    storage.setItem(budgetKey(now()), String(count))
  }

  const remaining = (): number => Math.max(0, maxPerDay - readCount())

  return {
    remaining,
    consume() {
      writeCount(readCount() + 1)
    },
    assertAvailable() {
      if (remaining() < minRemaining) {
        throw new ApiRateLimitError(`API-Football daily budget nearly exhausted (${remaining()} left)`)
      }
    },
  }
}

/**
 * Guards a fetch so it only runs while budget is available. The call is
 * counted even when the upstream fetch fails, because the request happened.
 */
export function withBudgetGuard<T>(budget: DailyBudget, fetch: () => Promise<T>): () => Promise<T> {
  return async () => {
    budget.assertAvailable()
    try {
      return await fetch()
    } finally {
      budget.consume()
    }
  }
}