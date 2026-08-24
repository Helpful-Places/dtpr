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

/**
 * Everything the two policies share. Factored out so a change to the
 * public posture (origin, exposed headers, credentials) can't drift
 * between `/api/v2` and the frozen legacy prefixes: the only field
 * either policy sets on its own is `allowHeaders`.
 */
const publicCorsOptions = {
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  exposeHeaders: ['X-Request-Id', 'DTPR-Content-Hash', 'Retry-After'],
  credentials: false,
  maxAge: 86400,
}

export const configuredCors = (): MiddlewareHandler =>
  cors({
    ...publicCorsOptions,
    allowHeaders: ['Content-Type', 'DTPR-Client', 'Authorization'],
  })

/**
 * CORS policy for the frozen legacy prefixes (`/api/v0`, `/api/v1`).
 *
 * Identical to {@link configuredCors} but for `allowHeaders`, which is
 * deliberately **omitted**: Hono's cors middleware echoes the caller's
 * `Access-Control-Request-Headers` back when the list is empty, so a
 * preflight is answered with exactly the headers it asked for.
 *
 * Why widen (R5, R18). The retired Nuxt surface answered every
 * preflight with `access-control-allow-headers: *`,
 * `access-control-allow-methods: *` and `access-control-max-age: 0`.
 * The house allow-list is narrower — `Content-Type`, `DTPR-Client`,
 * `Authorization` — so a browser consumer that sends any other request
 * header (`If-None-Match`, a tracing header, its own `X-…`) preflights
 * successfully against `dtpr.io` today and would start failing at
 * cutover. Reflecting the requested list is the widening, and it is
 * strictly wider than the literal `*` the legacy surface sent: the
 * Fetch spec excludes `Authorization` from the `*` wildcard, so an
 * echo accepts a superset of what `dtpr.io` accepted rather than
 * trading one narrowing for another.
 *
 * Two probed differences are **recorded as accepted** rather than
 * matched, because neither can reject a call that succeeds today:
 *
 *  - `allowMethods` stays `GET, POST, OPTIONS` rather than `*`. The
 *    frozen surface already sends every non-GET to the legacy 404 (an
 *    enumerated R21 departure the sub-apps own), so advertising more
 *    verbs would promise support that isn't there.
 *  - `maxAge` stays 86400 rather than 0. A longer preflight cache
 *    never rejects a request that would otherwise succeed — the
 *    CORS-preflight cache is keyed by header name, so a call needing a
 *    header outside the cached set simply preflights again — and it
 *    keeps preflight traffic off a Worker now shared with `/api/v2`
 *    (R17).
 *
 * Mount this **before** the global `configuredCors()` (KTD12). Hono's
 * cors middleware answers OPTIONS with 204 and never calls `next()`,
 * so whichever policy is registered first wins every preflight.
 */
export const legacyCors = (): MiddlewareHandler => cors({ ...publicCorsOptions })
