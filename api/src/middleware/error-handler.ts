import type { Hono } from 'hono'
import type { AppEnv } from '../app-types.ts'
import { R2LoadError } from '../store/r2-loader.ts'
import { ApiError, apiErrors, errorEnvelope } from './errors.ts'

/**
 * Installs the global `onError` + `notFound` handlers. Every error
 * path in the pipeline must funnel through here so clients see a
 * uniform envelope shape (no raw stack traces escape).
 *
 * Mapping:
 *  - `ApiError` → use its attached status + errors
 *  - `R2LoadError` → 502 upstream
 *  - anything else → 500 internal (message redacted)
 *
 * The request id from `c.var.requestId` is echoed in responses so
 * callers can report issues with a correlation key. Unexpected errors
 * are logged (with stack) so they're visible in Cloudflare logs.
 */
export function registerErrorHandler(app: Hono<AppEnv>): void {
  app.onError((err, c) => {
    const requestId = c.get('requestId')
    if (err instanceof ApiError) {
      return c.json(errorEnvelope(err.errors), err.status, {
        ...(requestId ? { 'X-Request-Id': requestId } : {}),
      })
    }
    if (err instanceof R2LoadError) {
      logUnhandled(c, err, 'r2_load_error')
      const e = apiErrors.upstreamError(err.key)
      return c.json(errorEnvelope(e.errors), e.status, {
        ...(requestId ? { 'X-Request-Id': requestId } : {}),
      })
    }
    logUnhandled(c, err, 'unhandled')
    const e = apiErrors.internal()
    return c.json(errorEnvelope(e.errors), e.status, {
      ...(requestId ? { 'X-Request-Id': requestId } : {}),
    })
  })

  app.notFound((c) => {
    const requestId = c.get('requestId')
    const err = apiErrors.notFound('Route not found.')
    return c.json(errorEnvelope(err.errors), err.status, {
      ...(requestId ? { 'X-Request-Id': requestId } : {}),
    })
  })
}

function logUnhandled(
  c: { req: { method: string; url: string }; get: (k: 'requestId') => string | undefined },
  err: unknown,
  tag: string,
): void {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  console.error(
    JSON.stringify({
      level: 'error',
      tag,
      method: c.req.method,
      url: c.req.url,
      request_id: c.get('requestId'),
      message,
      stack,
    }),
  )
}
