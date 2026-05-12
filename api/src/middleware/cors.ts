import { cors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'

/**
 * CORS policy: public, read + validate.
 *
 * The DTPR API is intentionally public. Every route is callable from any
 * origin, including browser-side JavaScript on third-party sites.
 *
 * `credentials: false` is required by the CORS spec when `origin: '*'`
 * — and is correct here regardless, since the API has no cookies, no
 * sessions, and no per-caller secrets. Anything that needs throttling
 * goes through the rate-limit middleware, not CORS.
 */
export const configuredCors = (): MiddlewareHandler =>
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'DTPR-Client', 'Authorization'],
    exposeHeaders: ['X-Request-Id', 'DTPR-Content-Hash', 'Retry-After'],
    credentials: false,
    maxAge: 86400,
  })
