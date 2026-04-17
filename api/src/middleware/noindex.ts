import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../app-types.ts'

/**
 * Stamp every preview response with `X-Robots-Tag: noindex, nofollow`
 * so search engines don't pick up in-flight taxonomy. The middleware
 * checks the request-scoped `c.env.ENVIRONMENT` binding at call time
 * rather than at registration, because Hono middleware is registered
 * once at module load but `c.env` is per-request — only the preview
 * `wrangler.jsonc` env sets `ENVIRONMENT: "preview"`, so production
 * responses pass through untouched.
 */
export const noindex = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    await next()
    if (c.env?.ENVIRONMENT === 'preview') {
      c.header('X-Robots-Tag', 'noindex, nofollow')
    }
  }
}
