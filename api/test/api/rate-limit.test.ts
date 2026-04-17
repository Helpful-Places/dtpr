import { describe, it, expect, beforeAll } from 'vitest'
import { SELF } from 'cloudflare:test'
import { Hono } from 'hono'
import type { AppEnv } from '../../src/app-types.ts'
import { rateLimit, _test } from '../../src/middleware/rate-limit.ts'
import { registerErrorHandler } from '../../src/middleware/error-handler.ts'
import { configuredRequestId } from '../../src/middleware/request-id.ts'
import { SAMPLE_VERSION, seedVersion } from './seed.ts'

describe('rate-limit: composeRateKey', () => {
  it('uses cf-connecting-ip + DTPR-Client header', () => {
    const req = headerBag({ 'cf-connecting-ip': '1.2.3.4', 'DTPR-Client': 'worcester/1.0' })
    expect(_test.composeRateKey(req)).toBe('1.2.3.4:worcester/1.0')
  })

  it('falls back to x-forwarded-for when cf-connecting-ip is absent', () => {
    const req = headerBag({ 'x-forwarded-for': '5.6.7.8' })
    expect(_test.composeRateKey(req)).toBe('5.6.7.8:anonymous')
  })

  it('collapses missing client header into the anonymous bucket', () => {
    const req = headerBag({ 'cf-connecting-ip': '9.9.9.9' })
    expect(_test.composeRateKey(req)).toBe('9.9.9.9:anonymous')
  })
})

describe('rate-limit: middleware', () => {
  it('no-ops when the binding is absent (preview/dev/tests)', async () => {
    const app = buildMiniApp()
    const res = await app.request('/hit', {}, { CONTENT: null as never })
    expect(res.status).toBe(200)
  })

  it('passes through on success and 429s on failure', async () => {
    const app = buildMiniApp()
    const fakeBinding = makeFakeRateLimit(['success', 'fail'])
    const bound = { RL_READ: fakeBinding } as unknown as Env
    const okRes = await app.request('/hit', { headers: { 'cf-connecting-ip': '1.1.1.1' } }, bound)
    expect(okRes.status).toBe(200)
    const blockedRes = await app.request(
      '/hit',
      { headers: { 'cf-connecting-ip': '1.1.1.1' } },
      bound,
    )
    expect(blockedRes.status).toBe(429)
    expect(blockedRes.headers.get('Retry-After')).toBe('60')
    const body = (await blockedRes.json()) as { ok: false; errors: { fix_hint?: string }[] }
    expect(body.errors[0]?.fix_hint).toContain('DTPR-Client')
  })

  it('isolates buckets by (IP, DTPR-Client) tuple', async () => {
    const app = buildMiniApp()
    const hits: string[] = []
    const binding = {
      limit(opts: { key: string }) {
        hits.push(opts.key)
        return Promise.resolve({ success: true })
      },
    }
    const bound = { RL_READ: binding } as unknown as Env

    await app.request(
      '/hit',
      { headers: { 'cf-connecting-ip': '1.1.1.1', 'DTPR-Client': 'worcester/1.0' } },
      bound,
    )
    await app.request(
      '/hit',
      { headers: { 'cf-connecting-ip': '1.1.1.1' } },
      bound,
    )
    expect(hits).toEqual(['1.1.1.1:worcester/1.0', '1.1.1.1:anonymous'])
  })
})

describe('rate-limit: E2E (production app, binding absent)', () => {
  beforeAll(async () => {
    await seedVersion()
  })

  it('responds 200 even without a real rate-limit binding in tests', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/manifest`,
    )
    expect(res.status).toBe(200)
  })
})

// ----------------------------------------------------------- helpers

function headerBag(headers: Record<string, string>) {
  return {
    header: (name: string) => {
      const k = Object.keys(headers).find((h) => h.toLowerCase() === name.toLowerCase())
      return k ? headers[k] : undefined
    },
  }
}

function makeFakeRateLimit(outcomes: Array<'success' | 'fail'>): RateLimit {
  let i = 0
  return {
    limit() {
      const next = outcomes[Math.min(i, outcomes.length - 1)]
      i++
      return Promise.resolve({ success: next === 'success' })
    },
  }
}

function buildMiniApp() {
  const app = new Hono<AppEnv>()
  app.use('*', configuredRequestId())
  app.use('/hit', rateLimit({ binding: 'RL_READ' }))
  app.get('/hit', (c) => c.json({ ok: true }))
  registerErrorHandler(app)
  return app
}
