import { Hono } from 'hono'
import type { AppEnv } from './app-types.ts'
import { configuredCors } from './middleware/cors.ts'
import { registerErrorHandler } from './middleware/error-handler.ts'
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
  app.use('/healthz', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas/:version/manifest', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas/:version/categories', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas/:version/elements', timeout({ budgetMs: readBudget }))
  app.use('/api/v2/schemas/:version/elements/:element_id', timeout({ budgetMs: readBudget }))
  app.use('/mcp', timeout({ budgetMs: readBudget }))

  // Rate limits (two buckets — validate is tighter). Middleware is a
  // no-op when the bindings are absent, so dev / test / preview
  // builds don't need to provision them.
  app.use('/api/v2/schemas/:version/validate', rateLimit({ binding: 'RL_VALIDATE' }))
  app.use('/api/v2/*', rateLimit({ binding: 'RL_READ' }))
  app.use('/mcp', rateLimit({ binding: 'RL_READ' }))

  app.get('/healthz', (c) => c.json({ ok: true, service: 'dtpr-api' }))
  app.route('/api/v2', createRestApp())
  app.all('/mcp', (c) => handleMcpRequest(c))

  registerErrorHandler(app)
  return app
}
