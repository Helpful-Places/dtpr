import type { MiddlewareHandler } from 'hono'

/**
 * Emits one structured log line per request with method, path, status,
 * duration, and request id. The line is JSON so it's filterable in
 * Cloudflare's workers observability UI.
 *
 * Failures still log — the error handler formats the response body;
 * we want the request trace regardless of status.
 */
export const logging = (): MiddlewareHandler => async (c, next) => {
  const start = Date.now()
  let error: unknown = undefined
  try {
    await next()
  } catch (e) {
    error = e
    throw e
  } finally {
    const duration = Date.now() - start
    const status = c.res?.status ?? (error ? 500 : 0)
    const urlPath = safePath(c.req.url)
    const line = {
      level: error ? 'error' : 'info',
      method: c.req.method,
      path: urlPath,
      status,
      duration_ms: duration,
      request_id: c.get('requestId'),
    }
    console.log(JSON.stringify(line))
  }
}

function safePath(raw: string): string {
  try {
    return new URL(raw).pathname
  } catch {
    return raw
  }
}
