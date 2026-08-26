import { Hono, type Context } from 'hono'
import type { AppEnv } from './app-types.ts'
import { configuredCors, legacyCors } from './middleware/cors.ts'
import { registerErrorHandler } from './middleware/error-handler.ts'
import { ApiError } from './middleware/errors.ts'
import { logging } from './middleware/logging.ts'
import { noindex } from './middleware/noindex.ts'
import { payloadLimits } from './middleware/payload-limits.ts'
import { rateLimit } from './middleware/rate-limit.ts'
import { configuredRequestId } from './middleware/request-id.ts'
import {
  DEFAULT_READ_BUDGET_MS,
  DEFAULT_VALIDATE_BUDGET_MS,
  timeout,
} from './middleware/timeout.ts'
import { handleMcpRequest } from './mcp/server.ts'
import { LEGACY_SERVER_ERROR, legacyErrorResponse } from './rest/legacy-shared.ts'
import { createLegacyV0App } from './rest/legacy-v0.ts'
import { createLegacyV1App } from './rest/legacy-v1.ts'
import { createRestApp } from './rest/routes.ts'

export type { AppEnv, AppVariables } from './app-types.ts'

export interface CreateAppOptions {
  /** Override the read-path wall-clock budget (defaults to 2 s). */
  readBudgetMs?: number
  /** Override the validate-path wall-clock budget (defaults to 5 s). */
  validateBudgetMs?: number
  /** Override the request-body byte cap (defaults to 64 KB). */
  maxPayloadBytes?: number
}

/**
 * Build the Hono application with the standard middleware stack.
 *
 * Order (outermost first):
 *   1. CORS — runs on every request, including preflight
 *   2. request-id — so logs downstream include a correlation key
 *   3. logging — emits a single JSON line per request
 *   4. payload-limits — cheap content-length short-circuit
 *   5. timeout — per-route wall-clock budget (route-scoped below)
 *   6. route handlers
 *   7. error handler — registered via `app.onError`
 */
export function createApp(options: CreateAppOptions = {}) {
  const app = new Hono<AppEnv>()

  // The legacy prefixes get a wider preflight allow-list than the rest
  // of the API (R18) — see `middleware/cors.ts` for what was probed and
  // what was accepted as narrowed. These two mounts must precede the
  // global one (KTD12): Hono's cors middleware answers OPTIONS with a
  // 204 and never calls `next()`, so a legacy-scoped mount registered
  // after the wildcard would never run. Same mount-order rule as the
  // route-specific rate-limit buckets further down.
  app.use('/api/v0/*', legacyCors())
  app.use('/api/v1/*', legacyCors())
  app.use('*', configuredCors())
  app.use('*', configuredRequestId())
  app.use('*', noindex())
  app.use('*', logging())
  app.use('*', payloadLimits(options.maxPayloadBytes))

  const readBudget = options.readBudgetMs ?? DEFAULT_READ_BUDGET_MS
  const validateBudget = options.validateBudgetMs ?? DEFAULT_VALIDATE_BUDGET_MS

  // POST .../validate gets the longer wall-clock budget; everything
  // else (including the MCP read paths) uses the read budget.
  //
  // Important: the read-budget timeout is mounted on each non-validate
  // route explicitly rather than on `'*'`. Hono runs middleware in
  // mount order, and the two timeouts do not nest cleanly — both
  // `Promise.race` timers run concurrently, so the shorter (read)
  // budget would always fire first if it also matched validate,
  // silently capping validate at 2 s instead of 5 s. A cold-cache
  // validate request hitting several R2 reads could then trip a
  // spurious 504 before its real budget expired.
  app.use('/api/v2/schemas/:version/validate', timeout({ budgetMs: validateBudget }))
  // Resolve + validate_resolved share the validate budget — same
  // semantic-rule cost profile (full schema slice + instance rules),
  // and resolve additionally runs canonicalStringify for the cap
  // check.
  app.use('/api/v2/schemas/:version/resolve', timeout({ budgetMs: validateBudget }))
  app.use(
    '/api/v2/schemas/:version/validate_resolved',
    timeout({ budgetMs: validateBudget }),
  )
  app.use('/healthz', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas/:version/manifest', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas/:version/categories', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas/:version/elements', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas/:version/elements/:element_id', timeout({ budgetMs: readBudget }))
  // Icon-serving routes — enumerated explicitly for the same reason
  // the JSON routes above are: the read-budget timeout is mounted
  // per-route rather than on `'*'` to keep it from racing the longer
  // validate budget. The composed-icon routes (Unit 8) are pre-wired
  // here so mounting them later doesn't require an app.ts edit.
  // `.svg`-suffix routes. Hono's default param regex allows dots, so
  // a segment like `:shape.svg` binds a single param whose value is
  // `hexagon.svg`; the `rest/routes.ts` handlers strip the suffix in
  // code rather than relying on the router. These mount patterns
  // mirror the route patterns in `rest/routes.ts` exactly — drifting
  // one from the other silently disables the wall-clock budget on the
  // affected route. The composed-icon variants (Unit 8) are
  // pre-mounted here so Unit 8 doesn't have to touch `app.ts`.
  app.use('/api/v2/shapes/:shape.svg', timeout({ budgetMs: readBudget }))
  app.use(
    '/api/v2/schemas/:version/symbols/:symbol_id.svg',
    timeout({ budgetMs: readBudget }),
  )
  // Composed icon routes mount as a single `:icon_variant` pattern
  // that captures `icon.svg`, `icon.dark.svg`, `icon.<ctx>.svg`, etc.
  // — see the comment at the mount site in `rest/routes.ts` for why
  // Hono's literal-dot-before-param form doesn't work here. The
  // timeout mount pattern must mirror the route pattern exactly, or
  // the wall-clock budget is silently skipped on the affected route.
  app.use(
    '/api/v2/schemas/:version/elements/:element_id/:icon_variant',
    timeout({ budgetMs: readBudget }),
  )
  app.use('/mcp', timeout({ budgetMs: readBudget }))

  // Rate limits (four buckets — icons are loosest, then read, then
  // validate, and resolve is tightest). Middleware is a no-op when the
  // bindings are absent, so dev / test / preview builds don't need to
  // provision them.
  //
  // Mount order matters. Hono runs `app.use` middleware in declaration
  // order and every matching mount runs, but a request is charged to
  // only the first bucket to run (see `middleware/rate-limit.ts`). So
  // the route-specific RL_VALIDATE / RL_RESOLVE / RL_ICONS mounts must
  // precede the wildcard RL_READ mount — behind it, they would never
  // be charged at all and every route would fall back to RL_READ's
  // ceiling.
  app.use('/api/v2/schemas/:version/validate', rateLimit({ binding: 'RL_VALIDATE' }))
  app.use('/api/v2/schemas/:version/resolve', rateLimit({ binding: 'RL_RESOLVE' }))
  app.use(
    '/api/v2/schemas/:version/validate_resolved',
    rateLimit({ binding: 'RL_RESOLVE' }),
  )
  // Icon bytes get their own, much larger bucket. They are pre-baked
  // R2 point-reads with a long `Cache-Control`, so they cost a
  // fraction of a JSON read, and they arrive in whole-library sweeps
  // rather than one at a time — the Figma plugin fetches ~470 in a
  // single build. Sharing RL_READ's 300/60s forced that build to pace
  // itself across two windows. These mount patterns must mirror the
  // route patterns in `rest/routes.ts` (and the timeout mounts above)
  // exactly; drifting one from the other silently drops the affected
  // route back onto the RL_READ wildcard below.
  app.use('/api/v2/shapes/:shape.svg', rateLimit({ binding: 'RL_ICONS' }))
  app.use(
    '/api/v2/schemas/:version/symbols/:symbol_id.svg',
    rateLimit({ binding: 'RL_ICONS' }),
  )
  app.use(
    '/api/v2/schemas/:version/elements/:element_id/:icon_variant',
    rateLimit({ binding: 'RL_ICONS' }),
  )
  app.use('/api/v2/*', rateLimit({ binding: 'RL_READ' }))
  app.use('/mcp', rateLimit({ binding: 'RL_READ' }))

  app.get('/healthz', (c) => c.json({ ok: true, service: 'dtpr-api' }))
  app.route('/api/v2', createRestApp())

  // The two frozen surfaces. Their middleware posture is assembled by
  // `mountLegacy` rather than spelled out here, because it has to live
  // *inside* each sub-app's error boundary — see that function.
  mountLegacy(app, '/api/v0', createLegacyV0App(), LEGACY_V0_ROUTE_PATTERNS, readBudget)
  mountLegacy(app, '/api/v1', createLegacyV1App(), LEGACY_V1_ROUTE_PATTERNS, readBudget)

  app.all('/mcp', (c) => handleMcpRequest(c))

  registerErrorHandler(app)
  return app
}

/**
 * Every route pattern `rest/legacy-v0.ts` registers, mount-relative and
 * in the unslashed form. `mountLegacy` registers the slashed twin of
 * each one itself, mirroring `registerBothSlashForms`.
 *
 * These are copies of the patterns in the sub-app, and drift between
 * the two silently disables the wall-clock budget on the affected
 * route — the same failure mode the per-route v2 timeout mounts have.
 * `test/api/legacy-mounting.test.ts` walks one live path per pattern,
 * both slash forms, against a stalled R2 read, so a drifted pattern
 * shows up as a missing 504.
 *
 * The sub-app's trailing `ALL *` (the legacy 404) is deliberately not
 * in this list: it is a synchronous string format over the request URL
 * with nothing to await, so there is nothing for a wall-clock budget to
 * interrupt. `/api/v2` treats its own not-found path the same way.
 */
const LEGACY_V0_ROUTE_PATTERNS = ['/icons/:icon_id', '/:locale'] as const

/** As above, for `rest/legacy-v1.ts`. */
const LEGACY_V1_ROUTE_PATTERNS = [
  '/icons/:icon_id',
  '/elements',
  '/elements/:datachain_type',
  '/categories/:datachain_type',
] as const

/**
 * Render an error thrown *inside* a legacy prefix in the legacy h3
 * envelope (KTD4).
 *
 * The global `app.onError` emits the v2 `{ok:false,errors:[…]}` shape
 * for every status, which is the wrong shape on a frozen surface. U3
 * and U4 covered their own handlers by returning legacy envelopes
 * directly; middleware is the third seam — `timeout()` throws a 504 and
 * `rateLimit()` a 429, as `ApiError`s, from code neither sub-app owns.
 *
 * Anything that isn't an `ApiError` (an `R2LoadError`, a genuine bug)
 * becomes the h3 500, which is what the legacy service did with an
 * unhandled handler exception.
 */
function renderLegacyError(err: unknown, c: Context<AppEnv>): Response {
  if (err instanceof ApiError) {
    return legacyErrorResponse(c, {
      status: err.status,
      statusMessage: err.errors[0]?.message ?? LEGACY_SERVER_ERROR,
    })
  }
  console.error(
    JSON.stringify({
      level: 'error',
      tag: 'legacy_unhandled',
      method: c.req.method,
      url: c.req.url,
      request_id: c.get('requestId'),
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  )
  return legacyErrorResponse(c, { status: 500, statusMessage: LEGACY_SERVER_ERROR })
}

/**
 * Mount one frozen legacy sub-app with the middleware posture
 * `/api/v2` has: a per-route wall-clock budget and the shared read
 * rate limit (R17). Neither is inherited — the v2 rate-limit wildcard
 * is literally `/api/v2/*` and every `timeout()` mount above is an
 * enumerated literal path — so both are mounted here explicitly.
 *
 * The middleware goes on an intermediate app rather than straight onto
 * the root, and that is load-bearing rather than stylistic. Hono's
 * `app.route()` wraps each mounted route's handler in the sub-app's own
 * `onError` — but only the routes it copies. A `timeout()` mounted with
 * `app.use('/api/v0/:locale', …)` on the *root* is a root-level
 * middleware, so its throw is caught by the root's compose and rendered
 * by the global `onError` in the v2 envelope. Registering it on
 * `mounted` instead makes it one of the routes `app.route()` copies,
 * which puts it inside `renderLegacyError`'s boundary. Verified against
 * the vendored Hono 4.12.28.
 *
 * Consequences worth naming:
 *  - Patterns here are mount-relative (`/:locale`, not
 *    `/api/v0/:locale`), so they mirror the sub-app's own registrations
 *    literally.
 *  - Root middleware registered above this call — CORS, request-id,
 *    logging, payload-limits — stays outside the boundary. Of those
 *    only payload-limits can produce an error response, and only for a
 *    request body the GET-only legacy surface never reads.
 *  - The rate-limit bucket is mounted on `'*'`, i.e. `/api/v0/*` once
 *    merged, matching v2's wildcard. It is registered after the
 *    route-specific RL_VALIDATE / RL_RESOLVE mounts and is scoped to a
 *    prefix those routes don't share, so it cannot shadow them.
 */
function mountLegacy(
  app: Hono<AppEnv>,
  prefix: string,
  legacyApp: Hono<AppEnv>,
  routePatterns: readonly string[],
  readBudgetMs: number,
): void {
  const mounted = new Hono<AppEnv>()
  mounted.onError(renderLegacyError)

  for (const pattern of routePatterns) {
    // Both slash forms, because the sub-app registers both (KTD3): a
    // sub-app's non-strict routing option is discarded at
    // `app.route()` mount time, so `/api/v1/elements/` is a separate
    // route and needs its own budget.
    mounted.use(pattern, timeout({ budgetMs: readBudgetMs }))
    mounted.use(`${pattern}/`, timeout({ budgetMs: readBudgetMs }))
  }

  mounted.use('*', rateLimit({ binding: 'RL_READ' }))

  mounted.route('/', legacyApp)
  app.route(prefix, mounted)
}
