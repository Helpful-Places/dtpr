import { cors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'

/**
 * Static allow-list (R32). Wildcards are forbidden; every origin is
 * explicitly enumerated plus a preview regex for ephemeral deploys.
 */
const ALLOW_LIST: readonly string[] = [
  'https://dtpr.io',
  'https://www.dtpr.io',
  'https://docs.dtpr.io',
  'https://studio.nuxt.com',
]

const PREVIEW_HOST_RE = /^https:\/\/[a-z0-9-]+-preview\.api\.dtpr\.io$/
const LOCAL_HOST_RE = /^http:\/\/localhost(:\d+)?$/
const LOCAL_127_RE = /^http:\/\/127\.0\.0\.1(:\d+)?$/

function isAllowedOrigin(origin: string): boolean {
  if (ALLOW_LIST.includes(origin)) return true
  if (PREVIEW_HOST_RE.test(origin)) return true
  if (LOCAL_HOST_RE.test(origin)) return true
  if (LOCAL_127_RE.test(origin)) return true
  return false
}

/**
 * CORS policy:
 *  - GET + POST only (no credentials, no cookies).
 *  - Explicit allow-list; no wildcards.
 *  - Preview hostnames matched by pattern so we don't have to enumerate
 *    every PR-specific subdomain.
 */
export const configuredCors = (): MiddlewareHandler =>
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'DTPR-Client', 'Authorization'],
    exposeHeaders: ['X-Request-Id', 'DTPR-Content-Hash', 'Retry-After'],
    credentials: false,
    maxAge: 86400,
  })

export const _test = { isAllowedOrigin }
