import { describe, it, expect, beforeAll } from 'vitest'
import { SELF, env } from 'cloudflare:test'
import { Hono } from 'hono'
import type { AppEnv } from '../../src/app-types.ts'
import { createApp } from '../../src/app.ts'
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

  it('charges only the first mount when several match one request', async () => {
    const app = new Hono<AppEnv>()
    const consumed: string[] = []
    const record = (name: string): RateLimit => ({
      limit() {
        consumed.push(name)
        return Promise.resolve({ success: true })
      },
    })
    app.use('*', configuredRequestId())
    app.use('/hit', rateLimit({ binding: 'RL_ICONS' }))
    app.use('*', rateLimit({ binding: 'RL_READ' }))
    app.get('/hit', (c) => c.json({ ok: true }))
    registerErrorHandler(app)

    const bound = { RL_ICONS: record('RL_ICONS'), RL_READ: record('RL_READ') } as unknown as Env
    const res = await app.request('/hit', { headers: { 'cf-connecting-ip': '1.1.1.1' } }, bound)
    expect(res.status).toBe(200)
    expect(consumed).toEqual(['RL_ICONS'])
  })

  it('falls through to a later mount when the first binding is absent', async () => {
    const app = new Hono<AppEnv>()
    const consumed: string[] = []
    app.use('*', configuredRequestId())
    // RL_ICONS unprovisioned — the request must still be metered by the
    // wildcard rather than escaping unmetered.
    app.use('/hit', rateLimit({ binding: 'RL_ICONS' }))
    app.use('*', rateLimit({ binding: 'RL_READ' }))
    app.get('/hit', (c) => c.json({ ok: true }))
    registerErrorHandler(app)

    const bound = {
      RL_READ: {
        limit() {
          consumed.push('RL_READ')
          return Promise.resolve({ success: true })
        },
      },
    } as unknown as Env
    await app.request('/hit', { headers: { 'cf-connecting-ip': '1.1.1.1' } }, bound)
    expect(consumed).toEqual(['RL_READ'])
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

/**
 * Which bucket each route actually consumes, through the real
 * `createApp()` middleware stack.
 *
 * The icon mounts are enumerated per route pattern and sit ahead of
 * the `/api/v2/*` wildcard, so a mount pattern that drifts from the
 * route in `rest/routes.ts` fails open onto RL_READ — silently, and
 * only visible as the Figma plugin throttling again. These assertions
 * are the thing that catches that.
 */
describe('rate-limit: bucket routing', () => {
  beforeAll(async () => {
    await seedVersion()
  })

  const V = encodeURIComponent(SAMPLE_VERSION.canonical)

  const iconPaths = [
    '/api/v2/shapes/hexagon.svg',
    `/api/v2/schemas/${V}/symbols/accept_deny.svg`,
    `/api/v2/schemas/${V}/elements/accept_deny/icon.svg`,
    `/api/v2/schemas/${V}/elements/accept_deny/icon.dark.svg`,
    `/api/v2/schemas/${V}/elements/accept_deny/icon.ai_only.svg`,
  ]

  it.each(iconPaths)('routes %s to RL_ICONS', async (path) => {
    const { app, consumed } = appWithRecordingBuckets()
    await app.request(`https://example.com${path}`, {}, recordingEnv(consumed))
    expect(consumed.names).toEqual(['RL_ICONS'])
  })

  const jsonPaths = [
    '/api/v2/schemas',
    `/api/v2/schemas/${V}/manifest`,
    `/api/v2/schemas/${V}/categories`,
    `/api/v2/schemas/${V}/elements`,
    // Element detail is one segment shorter than the icon pattern; if
    // the icon mount ever widened to `:element_id/*` this would move.
    `/api/v2/schemas/${V}/elements/accept_deny`,
  ]

  it.each(jsonPaths)('leaves %s on RL_READ', async (path) => {
    const { app, consumed } = appWithRecordingBuckets()
    await app.request(`https://example.com${path}`, {}, recordingEnv(consumed))
    expect(consumed.names).toEqual(['RL_READ'])
  })

  it('charges validate to RL_VALIDATE only, not also the read wildcard', async () => {
    const { app, consumed } = appWithRecordingBuckets()
    await app.request(
      `https://example.com/api/v2/schemas/${V}/validate`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      recordingEnv(consumed),
    )
    expect(consumed.names).toEqual(['RL_VALIDATE'])
  })

  it('charges resolve to RL_RESOLVE only, not also the read wildcard', async () => {
    const { app, consumed } = appWithRecordingBuckets()
    await app.request(
      `https://example.com/api/v2/schemas/${V}/resolve`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      recordingEnv(consumed),
    )
    expect(consumed.names).toEqual(['RL_RESOLVE'])
  })

  it('charges an icon request exactly one token', async () => {
    const { app, consumed } = appWithRecordingBuckets()
    await app.request(
      `https://example.com/api/v2/schemas/${V}/elements/accept_deny/icon.svg`,
      {},
      recordingEnv(consumed),
    )
    expect(consumed.names).toHaveLength(1)
  })

  it('429s icon routes off RL_ICONS, not RL_READ', async () => {
    const app = createApp()
    const bound = {
      ...env,
      RL_READ: makeFakeRateLimit(['success']),
      RL_ICONS: makeFakeRateLimit(['fail']),
    } as unknown as Env
    const res = await app.request(
      `https://example.com/api/v2/schemas/${V}/elements/accept_deny/icon.svg`,
      {},
      bound,
    )
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
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

/**
 * The real app plus a recorder that logs every bucket name consumed,
 * in order. Bindings always succeed here — the question under test is
 * *which* bucket ran, not whether it let the request through.
 */
function appWithRecordingBuckets() {
  const consumed = { names: [] as string[] }
  return { app: createApp(), consumed }
}

function recordingEnv(consumed: { names: string[] }): Env {
  const bucket = (name: string): RateLimit => ({
    limit() {
      consumed.names.push(name)
      return Promise.resolve({ success: true })
    },
  })
  return {
    ...env,
    RL_READ: bucket('RL_READ'),
    RL_VALIDATE: bucket('RL_VALIDATE'),
    RL_RESOLVE: bucket('RL_RESOLVE'),
    RL_ICONS: bucket('RL_ICONS'),
  } as unknown as Env
}

function buildMiniApp() {
  const app = new Hono<AppEnv>()
  app.use('*', configuredRequestId())
  app.use('/hit', rateLimit({ binding: 'RL_READ' }))
  app.get('/hit', (c) => c.json({ ok: true }))
  registerErrorHandler(app)
  return app
}
