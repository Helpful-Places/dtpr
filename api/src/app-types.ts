/**
 * Shared Hono app environment type. Declared once here so middleware
 * and routes agree on the shape of `c.var` and `c.env`.
 */

export interface AppVariables {
  /** Populated by the request-id middleware (hono/request-id). */
  requestId: string
  /** Populated by the timeout middleware; loaders may honor it. */
  abortSignal: AbortSignal
}

export interface AppEnv {
  Bindings: Env
  Variables: AppVariables
}
