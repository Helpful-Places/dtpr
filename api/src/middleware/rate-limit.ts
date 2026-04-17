import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../app-types.ts'
import { apiErrors } from './errors.ts'

/** Window used for the synthetic Retry-After hint. Matches the WAF rule period. */
const RETRY_AFTER_SECONDS = 60
const ANONYMOUS_CLIENT = 'anonymous'
const CLIENT_HEADER = 'DTPR-Client'

/**
 * Extract the caller's stable rate-limit identity. IP + the
 * (voluntary) `DTPR-Client: name/version` header. Anonymous callers
 * all share one bucket; identified clients get their own, which lets
 * a legitimate shared-egress tool (Claude Desktop, worcester-app)
 * escape the anonymous-pool noise.
 */
export function composeRateKey(req: { header: (name: string) => string | undefined }): string {
  const ip = req.header('cf-connecting-ip') ?? req.header('x-forwarded-for') ?? 'unknown'
  const client = req.header(CLIENT_HEADER)?.trim()
  return `${ip}:${client && client.length > 0 ? client : ANONYMOUS_CLIENT}`
}

/**
 * Resolve a rate-limit binding by name. Returns `null` when the
 * binding is not configured (dev, unit tests, preview bootstrap) so
 * the middleware can skip quietly instead of 500'ing.
 */
function getBinding(env: Env, name: string): RateLimit | null {
  const candidate = (env as unknown as Record<string, unknown>)[name]
  if (candidate && typeof (candidate as RateLimit).limit === 'function') {
    return candidate as RateLimit
  }
  return null
}

export interface RateLimitMiddlewareOptions {
  /**
   * Env binding name for the rate-limit bucket to consume from.
   * Typically `RL_READ` or `RL_VALIDATE`.
   */
  binding: string
}

/**
 * Middleware that consumes one token from the named rate-limit
 * binding (Workers Rate Limit API) per request. Over-limit responses
 * get a typed 429 envelope with a `Retry-After` header and a
 * fix_hint that points clients at the `DTPR-Client` convention.
 *
 * No-op when the binding is missing so the middleware is safe to
 * include in test and preview builds without extra gating.
 */
export const rateLimit = (
  options: RateLimitMiddlewareOptions,
): MiddlewareHandler<AppEnv> => async (c, next) => {
  const binding = getBinding(c.env, options.binding)
  if (!binding) {
    await next()
    return
  }
  const key = composeRateKey(c.req)
  const { success } = await binding.limit({ key })
  if (!success) {
    c.header('Retry-After', String(RETRY_AFTER_SECONDS))
    throw apiErrors.rateLimited(RETRY_AFTER_SECONDS)
  }
  await next()
}

export const _test = { composeRateKey, getBinding, CLIENT_HEADER }
