import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../../../src/app-types.ts'
import { payloadLimits, MAX_PAYLOAD_BYTES } from '../../../src/middleware/payload-limits.ts'
import { registerErrorHandler } from '../../../src/middleware/error-handler.ts'

function buildApp(maxBytes?: number) {
  const app = new Hono<AppEnv>()
  app.use('*', payloadLimits(maxBytes))
  app.post('/echo', async (c) => c.json({ ok: true }))
  app.post('/parse', async (c) => {
    // Forces the body to be read after the middleware has consumed it,
    // so we can verify that bodyCache re-attachment works.
    const json = await c.req.json()
    return c.json({ ok: true, got: json })
  })
  registerErrorHandler(app)
  return app
}

function streamOf(bytes: Uint8Array, chunkSize = 1024): ReadableStream<Uint8Array> {
  let offset = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.byteLength) {
        controller.close()
        return
      }
      const end = Math.min(offset + chunkSize, bytes.byteLength)
      controller.enqueue(bytes.slice(offset, end))
      offset = end
    },
  })
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

  it('rejects oversize streamed (chunked) bodies with no Content-Length', async () => {
    const app = buildApp(1024)
    const payload = new Uint8Array(4096) // 4 KB > 1 KB cap
    const res = await app.request(
      '/echo',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: streamOf(payload),
        // Required when sending a ReadableStream body.
        // @ts-expect-error duplex is part of the fetch spec but not all libdom typings include it.
        duplex: 'half',
      },
    )
    expect(res.status).toBe(413)
    const json = (await res.json()) as { ok: false; errors: { code: string }[] }
    expect(json.ok).toBe(false)
    expect(json.errors[0]?.code).toBe('payload_too_large')
  })

  it('allows under-cap streamed bodies and re-exposes them to the route', async () => {
    const app = buildApp(1024)
    const payload = new TextEncoder().encode(JSON.stringify({ hello: 'world' }))
    const res = await app.request(
      '/parse',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: streamOf(payload),
        // @ts-expect-error duplex is part of the fetch spec but not all libdom typings include it.
        duplex: 'half',
      },
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as { ok: true; got: { hello: string } }
    expect(json.ok).toBe(true)
    expect(json.got).toEqual({ hello: 'world' })
  })
})
