import type { MiddlewareHandler } from 'hono'
import { apiErrors } from './errors.ts'

/**
 * Default wall-clock budgets. The plan targets tighter numbers (50 ms
 * reads / 500 ms validate) — those are the production SLOs. The
 * defaults here are generous enough that genuine cold-cache R2 reads
 * won't trip the guard in local / test environments; route-specific
 * budgets can be passed when mounting the middleware per route.
 *
 * CPU budget is enforced separately by Wrangler `limits.cpu_ms`.
 */
export const DEFAULT_READ_BUDGET_MS = 2_000
export const DEFAULT_VALIDATE_BUDGET_MS = 5_000

export interface TimeoutOptions {
  /** Budget in milliseconds for this mount's handler. */
  budgetMs: number
}

/**
 * Wall-clock timeout via AbortController + `setTimeout`. Race pattern:
 * the handler runs as normal; an AbortSignal is exposed on
 * `c.var.abortSignal` so loaders can abort their own inner work; when
 * the timer fires, we reject with a typed 504 envelope.
 *
 * Note: JavaScript cannot actually stop a running handler, so a
 * CPU-bound handler past its budget keeps burning until it yields.
 * The signal-based opt-in is the cooperative half; `limits.cpu_ms`
 * is the coercive one.
 */
export const timeout = (options: TimeoutOptions): MiddlewareHandler =>
  async (c, next) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.budgetMs)
    c.set('abortSignal', controller.signal)
    try {
      await Promise.race([
        next(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener(
            'abort',
            () => reject(apiErrors.timeout(options.budgetMs)),
            { once: true },
          )
        }),
      ])
    } finally {
      clearTimeout(timer)
    }
  }
