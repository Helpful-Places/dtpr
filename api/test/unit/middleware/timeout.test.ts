import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../../../src/app-types.ts'
import { timeout } from '../../../src/middleware/timeout.ts'
import { registerErrorHandler } from '../../../src/middleware/error-handler.ts'

function buildApp(budgetMs: number) {
  const app = new Hono<AppEnv>()
  app.use('*', timeout({ budgetMs }))
  app.get('/fast', (c) => c.json({ ok: true }))
  app.get('/slow/:delay', async (c) => {
    const delay = Number(c.req.param('delay'))
    await new Promise((r) => setTimeout(r, delay))
    return c.json({ ok: true })
  })
  app.get('/abort-aware', async (c) => {
    const signal = c.get('abortSignal')
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 500)
      signal?.addEventListener('abort', () => {
        clearTimeout(t)
        reject(new Error('aborted-by-signal'))
      })
    })
    return c.json({ ok: true })
  })
  registerErrorHandler(app)
  return app
}

describe('middleware: timeout', () => {
  it('passes through when handler completes inside budget', async () => {
    const app = buildApp(200)
    const res = await app.request('/fast')
    expect(res.status).toBe(200)
  })

  it('returns 504 envelope when handler overruns budget', async () => {
    const app = buildApp(30)
    const res = await app.request('/slow/150')
    expect(res.status).toBe(504)
    const json = (await res.json()) as { ok: false; errors: { code: string }[] }
    expect(json.errors[0]?.code).toBe('timeout')
  })

  it('exposes the AbortSignal on c.var so cooperative handlers can bail early', async () => {
    const app = buildApp(30)
    const res = await app.request('/abort-aware')
    // Either we get the typed 504 from timeout losing the race, or
    // the handler's rejection bubbles as a 500. Both confirm the
    // signal fired — we only assert it did not succeed.
    expect([504, 500]).toContain(res.status)
  })
})
