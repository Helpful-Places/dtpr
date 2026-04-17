import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../../../src/app-types.ts'
import { payloadLimits, MAX_PAYLOAD_BYTES } from '../../../src/middleware/payload-limits.ts'
import { registerErrorHandler } from '../../../src/middleware/error-handler.ts'

function buildApp(maxBytes?: number) {
  const app = new Hono<AppEnv>()
  app.use('*', payloadLimits(maxBytes))
  app.post('/echo', async (c) => c.json({ ok: true }))
  registerErrorHandler(app)
  return app
}

describe('middleware: payload-limits', () => {
  it('allows requests under the limit', async () => {
    const app = buildApp(1000)
    const body = 'a'.repeat(500)
    const res = await app.request('/echo', {
      method: 'POST',
      headers: { 'Content-Length': String(body.length), 'Content-Type': 'application/octet-stream' },
      body,
    })
    expect(res.status).toBe(200)
  })

  it('rejects requests exceeding the limit with 413 envelope', async () => {
    const app = buildApp(100)
    const res = await app.request('/echo', {
      method: 'POST',
      headers: { 'Content-Length': '200', 'Content-Type': 'application/octet-stream' },
      body: 'a'.repeat(200),
    })
    expect(res.status).toBe(413)
    const json = (await res.json()) as { ok: false; errors: { code: string }[] }
    expect(json.ok).toBe(false)
    expect(json.errors[0]?.code).toBe('payload_too_large')
  })

  it('rejects malformed Content-Length as 400', async () => {
    const app = buildApp()
    const res = await app.request('/echo', {
      method: 'POST',
      headers: { 'Content-Length': 'not-a-number' },
    })
    expect(res.status).toBe(400)
  })

  it('defaults to 64 KB when no limit is supplied', () => {
    expect(MAX_PAYLOAD_BYTES).toBe(64 * 1024)
  })
})
