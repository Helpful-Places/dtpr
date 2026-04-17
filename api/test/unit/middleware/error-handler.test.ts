import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../../../src/app-types.ts'
import { configuredRequestId } from '../../../src/middleware/request-id.ts'
import { registerErrorHandler } from '../../../src/middleware/error-handler.ts'
import { ApiError, apiErrors } from '../../../src/middleware/errors.ts'
import { R2LoadError } from '../../../src/store/r2-loader.ts'

function buildApp() {
  const app = new Hono<AppEnv>()
  app.use('*', configuredRequestId())
  app.get('/boom', () => {
    throw new Error('kaboom')
  })
  app.get('/not-found', () => {
    throw apiErrors.notFound('No such element.', 'Use list_elements to enumerate.')
  })
  app.get('/rate-limited', () => {
    throw apiErrors.rateLimited(42)
  })
  app.get('/upstream', () => {
    throw new R2LoadError('connection reset', 'schemas/ai/2026-04-16/manifest.json')
  })
  app.get('/validation', () => {
    throw new ApiError(400, [
      { code: 'bad_field', message: 'foo is invalid', path: 'datachain.foo' },
    ])
  })
  registerErrorHandler(app)
  return app
}

describe('middleware: error-handler', () => {
  it('translates ApiError to its declared status + envelope', async () => {
    const app = buildApp()
    const res = await app.request('/not-found')
    expect(res.status).toBe(404)
    const body = (await res.json()) as {
      ok: false
      errors: { code: string; fix_hint?: string }[]
    }
    expect(body.ok).toBe(false)
    expect(body.errors[0]?.code).toBe('not_found')
    expect(body.errors[0]?.fix_hint).toContain('list_elements')
  })

  it('emits rate-limited envelope with fix_hint referencing DTPR-Client', async () => {
    const app = buildApp()
    const res = await app.request('/rate-limited')
    expect(res.status).toBe(429)
    const body = (await res.json()) as { errors: { fix_hint?: string }[] }
    expect(body.errors[0]?.fix_hint).toContain('DTPR-Client')
  })

  it('maps R2LoadError to 502 upstream envelope', async () => {
    const app = buildApp()
    const res = await app.request('/upstream')
    expect(res.status).toBe(502)
    const body = (await res.json()) as { errors: { code: string }[] }
    expect(body.errors[0]?.code).toBe('upstream_error')
  })

  it('swallows unexpected errors and returns 500 without leaking the message', async () => {
    const app = buildApp()
    const res = await app.request('/boom')
    expect(res.status).toBe(500)
    const body = (await res.json()) as { errors: { code: string; message: string }[] }
    expect(body.errors[0]?.code).toBe('internal_error')
    expect(body.errors[0]?.message).not.toContain('kaboom')
  })

  it('echoes X-Request-Id on every error response', async () => {
    const app = buildApp()
    const res = await app.request('/boom', { headers: { 'X-Request-Id': 'test-42' } })
    expect(res.headers.get('X-Request-Id')).toBe('test-42')
  })

  it('preserves per-field path metadata in validation errors', async () => {
    const app = buildApp()
    const res = await app.request('/validation')
    expect(res.status).toBe(400)
    const body = (await res.json()) as { errors: { path?: string }[] }
    expect(body.errors[0]?.path).toBe('datachain.foo')
  })

  it('unmatched routes return 404 envelope', async () => {
    const app = buildApp()
    const res = await app.request('/nope')
    expect(res.status).toBe(404)
    const body = (await res.json()) as { ok: false; errors: { code: string }[] }
    expect(body.errors[0]?.code).toBe('not_found')
  })
})
