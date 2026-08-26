/**
 * Shared Hono app environment type. Declared once here so middleware
 * and routes agree on the shape of `c.var` and `c.env`.
 */

export interface AppVariables {
  /** Populated by the request-id middleware (hono/request-id). */
  requestId: string
  /** Populated by the timeout middleware; loaders may honor it. */
  abortSignal: AbortSignal
  /**
   * Set by the first `rateLimit()` mount to run on a request. Later
   * mounts see it and skip, so a request is charged to exactly one
   * bucket — the most specific one — rather than to every mount whose
   * pattern happens to match. See `middleware/rate-limit.ts`.
   */
  rateLimitCharged?: true
}

export interface AppEnv {
  Bindings: Env
  Variables: AppVariables
}
