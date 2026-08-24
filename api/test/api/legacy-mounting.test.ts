import { describe, it, expect, beforeAll } from 'vitest'
import {
  env,
  SELF,
  createExecutionContext,
  waitOnExecutionContext,
} from 'cloudflare:test'
import { createApp } from '../../src/app.ts'
import { LEGACY_V0_LOCALES } from '../../src/rest/legacy-v0.ts'
import { legacyDocumentKey, legacyIconKey } from '../../src/store/keys.ts'
import { legacyDocument, legacyIcon } from './legacy-fixtures.ts'
import { evict } from './legacy-test-helpers.ts'
import { SAMPLE_VERSION, seedVersion } from './seed.ts'

/**
 * U5: the two frozen sub-apps as the Worker actually mounts them.
 *
 * U3 and U4 tested their factories in isolation, under a bare
 * `new Hono().route(...)`. That proved the handlers; it could not prove
 * the mount. Everything here goes through the real `createApp()`
 * pipeline — most of it through `SELF.fetch`, i.e. the deployed
 * `src/index.ts` entry — so the assertions cover the middleware posture
 * (R17), the preflight allow-list (R5, R18) and, most importantly, that
 * the mount preserves the semantics U3/U4 specified.
 *
 * Cache hygiene follows the legacy suites' rule and for their reason:
 * legacy cache keys carry no version segment, `caches.default` is a
 * real Miniflare cache that outlives isolated R2 storage, and
 * `test/unit/legacy-loader.test.ts` deliberately writes junk bytes to
 * some of these keys.
 */

const ORIGIN = 'https://example.com'
const ICON_ID = 'accessibility'

/** Every v1 document path this suite serves, as `legacyDocumentKey` takes it. */
const V1_DOCUMENT_PATHS = [
  'elements',
  'elements/ai',
  'elements/device',
  'categories/ai',
  'categories/device',
] as const

/**
 * One live request path per legacy route pattern, unslashed. The
 * timeout mounts in `app.ts` are enumerated per pattern, so a mount
 * that drifts from its route shows up here as a missing 504 rather
 * than as silence.
 */
const LEGACY_ROUTE_PATHS = [
  '/api/v0/en',
  `/api/v0/icons/${ICON_ID}.svg`,
  '/api/v1/elements',
  '/api/v1/elements/ai',
  '/api/v1/categories/ai',
  `/api/v1/icons/${ICON_ID}.svg`,
] as const

/** Both slash forms of every legacy route (R15, KTD3). */
const LEGACY_ROUTE_PATHS_BOTH_FORMS = LEGACY_ROUTE_PATHS.flatMap((p) => [p, `${p}/`])

beforeAll(async () => {
  // `seedVersion` clears the bucket, so the v2 fixtures land first and
  // the legacy objects are written on top of them. Both surfaces have
  // to be live at once: the last describe asserts v2 is unchanged.
  await seedVersion()

  const writes: Array<readonly [string, string]> = [
    ...LEGACY_V0_LOCALES.map(
      (locale) => [legacyDocumentKey('v0', locale), legacyDocument(`v0/${locale}`)] as const,
    ),
    ...V1_DOCUMENT_PATHS.map(
      (path) => [legacyDocumentKey('v1', path), legacyDocument(`v1/${path}`)] as const,
    ),
    [legacyIconKey('v0', ICON_ID), legacyIcon(ICON_ID)] as const,
    [legacyIconKey('v1', ICON_ID), legacyIcon(ICON_ID)] as const,
  ]

  await evict(writes.map(([key]) => key))
  await Promise.all(writes.map(([key, value]) => env.CONTENT.put(key, value)))
})

/** Drive the composed app directly — needed to override a budget. */
async function request(
  app: ReturnType<typeof createApp>,
  path: string,
  init: RequestInit = {},
  bindings: Env = env,
): Promise<Response> {
  const ctx = createExecutionContext()
  const res = await app.fetch(new Request(`${ORIGIN}${path}`, init), bindings, ctx)
  await waitOnExecutionContext(ctx)
  return res
}

function parseLegacyEnvelope(text: string): Record<string, unknown> {
  return JSON.parse(text) as Record<string, unknown>
}

describe('legacy mounting: wall-clock budget (R17)', () => {
  it.each(LEGACY_ROUTE_PATHS_BOTH_FORMS)(
    'applies a wall-clock budget to %s',
    async (path) => {
      // A 504 here means the timeout middleware matched this exact
      // path. A mount pattern that drifted from its route leaves the
      // request in the stalled read with nothing to interrupt it, so
      // the regression surfaces as this case exhausting its own
      // timeout rather than as silence.
      const res = await request(
        createApp({ readBudgetMs: BUDGET_MS }),
        path,
        {},
        stalledBindings(),
      )
      expect(res.status, path).toBe(504)
    },
    STALL_TEST_TIMEOUT_MS,
  )

  it('leaves the v2 validate budget alone', async () => {
    // The legacy mounts must not race the longer validate budget: a
    // read-budget timeout that also matched validate would cap it at
    // the read budget. Under the same stall, validate has to run out
    // its own budget — and the 504 body names which one expired, so
    // this distinguishes the two rather than just observing a 504.
    const app = createApp({
      readBudgetMs: BUDGET_MS,
      validateBudgetMs: VALIDATE_BUDGET_MS,
    })
    const res = await request(
      app,
      `/api/v2/schemas/${SAMPLE_VERSION.canonical}/validate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance: {} }),
      },
      stalledBindings(),
    )
    expect(res.status).toBe(504)
    const body = (await res.json()) as { errors: Array<{ message: string }> }
    expect(body.errors[0]?.message).toContain(`${VALIDATE_BUDGET_MS}-ms`)
  }, STALL_TEST_TIMEOUT_MS)
})

describe('legacy mounting: error envelopes from middleware (KTD4)', () => {
  it('renders a timeout in the legacy envelope, charset-free', async () => {
    const app = createApp({ readBudgetMs: BUDGET_MS })
    const res = await request(app, '/api/v0/en', {}, stalledBindings())

    expect(res.status).toBe(504)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = parseLegacyEnvelope(await res.text())
    expect(Object.keys(body)).toEqual([
      'error',
      'url',
      'statusCode',
      'statusMessage',
      'message',
    ])
    expect(body.error).toBe(true)
    expect(body.statusCode).toBe(504)
    expect(body.message).toBe(body.statusMessage)
    expect(body.url).toBe(`${ORIGIN}/api/v0/en`)
    expect(body).not.toHaveProperty('ok')
    expect(body).not.toHaveProperty('errors')
  })

  it('renders a timeout on /api/v1 in the legacy envelope too', async () => {
    const app = createApp({ readBudgetMs: BUDGET_MS })
    const res = await request(app, '/api/v1/elements/ai', {}, stalledBindings())
    expect(res.status).toBe(504)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = parseLegacyEnvelope(await res.text())
    expect(body.statusCode).toBe(504)
    expect(body).not.toHaveProperty('errors')
  })

  it('renders a rate limit in the legacy envelope, with Retry-After', async () => {
    const app = createApp()
    const res = await request(app, '/api/v0/en', {}, blockedRateLimit())

    expect(res.status).toBe(429)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(res.headers.get('Retry-After')).toBe('60')
    const body = parseLegacyEnvelope(await res.text())
    expect(Object.keys(body)).toEqual([
      'error',
      'url',
      'statusCode',
      'statusMessage',
      'message',
    ])
    expect(body.statusCode).toBe(429)
    expect(body).not.toHaveProperty('errors')
  })

  it('rate-limits /api/v1 into the legacy envelope as well', async () => {
    const app = createApp()
    const res = await request(app, '/api/v1/elements', {}, blockedRateLimit())
    expect(res.status).toBe(429)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(parseLegacyEnvelope(await res.text()).statusCode).toBe(429)
  })

  it('renders an unreadable content store as the h3 500, not the v2 502', async () => {
    // Before the sub-apps had their own error handler this reached the
    // global one as an `R2LoadError` and rendered `{ok:false,errors}`
    // at 502. The legacy service had no such envelope — an exception
    // out of a handler was an h3 500 — so the boundary has to catch
    // the non-`ApiError` case too.
    const bucket = {
      get: () => Promise.reject(new Error('store unreachable')),
    } as unknown as R2Bucket
    const res = await request(createApp(), '/api/v0/en', {}, {
      ...env,
      CONTENT: bucket,
    } as unknown as Env)

    expect(res.status).toBe(500)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = parseLegacyEnvelope(await res.text())
    expect(body.statusMessage).toBe('Server Error')
    expect(body).not.toHaveProperty('errors')
  })

  it('still renders the v2 envelope for a rate-limited v2 request', async () => {
    const app = createApp()
    const res = await request(app, '/api/v2/schemas', {}, blockedRateLimit())
    expect(res.status).toBe(429)
    const body = (await res.json()) as { ok: false; errors: Array<{ code: string }> }
    expect(body.ok).toBe(false)
    expect(body.errors[0]?.code).toBe('rate_limited')
  })
})

describe('legacy mounting: CORS (R5, R18, KTD12)', () => {
  const PREFLIGHT_HEADERS = 'x-dtpr-experiment, if-none-match, content-type'

  it.each(['/api/v0/en', '/api/v1/elements'])(
    'permits every request header the Nuxt surface accepted on %s',
    async (path) => {
      const res = await SELF.fetch(`${ORIGIN}${path}`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://consumer.example',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': PREFLIGHT_HEADERS,
        },
      })

      expect(res.status).toBe(204)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
      const allowed = (res.headers.get('Access-Control-Allow-Headers') ?? '').toLowerCase()
      for (const header of ['x-dtpr-experiment', 'if-none-match', 'content-type']) {
        expect(allowed, `${path} must allow ${header}`).toContain(header)
      }
    },
  )

  it('does not loosen the /api/v2 allow-list', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v2/schemas`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://consumer.example',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': PREFLIGHT_HEADERS,
      },
    })
    const allowed = (res.headers.get('Access-Control-Allow-Headers') ?? '').toLowerCase()
    expect(allowed).toContain('content-type')
    expect(allowed).not.toContain('x-dtpr-experiment')
  })

  it.each(['/api/v0/en', '/api/v1/elements', '/api/v0/icons/accessibility.svg'])(
    'answers a cross-origin GET on %s with a permissive allow-origin',
    async (path) => {
      const res = await SELF.fetch(`${ORIGIN}${path}`, {
        headers: { Origin: 'https://consumer.example' },
      })
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    },
  )
})

describe('legacy mounting: U3/U4 semantics survive the mount', () => {
  it('serves /api/v0/en byte-for-byte through the Worker entry', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v0/en`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(await res.text()).toBe(legacyDocument('v0/en'))
  })

  it('serves /api/v1/elements byte-for-byte through the Worker entry', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v1/elements`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(await res.text()).toBe(legacyDocument('v1/elements'))
  })

  it.each([
    ['/api/v0/en/', 'v0/en'],
    ['/api/v1/elements/', 'v1/elements'],
    ['/api/v1/elements/ai/', 'v1/elements/ai'],
    ['/api/v1/categories/device/', 'v1/categories/device'],
  ])('resolves the trailing-slash form of %s through the mount', async (path, id) => {
    const res = await SELF.fetch(`${ORIGIN}${path}`)
    expect(res.status, path).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(await res.text()).toBe(legacyDocument(id))
  })

  it('resolves the trailing-slash form of the icon route', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v0/icons/${ICON_ID}.svg/`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml')
    expect(await res.text()).toBe(legacyIcon(ICON_ID))
  })

  it.each([
    '/api/v0',
    '/api/v0/en/extra/deep',
    '/api/v1',
    '/api/v1/categories',
    '/api/v1/nope',
  ])('answers %s with the legacy 404 rather than the v2 envelope', async (path) => {
    const res = await SELF.fetch(`${ORIGIN}${path}`)
    expect(res.status, path).toBe(404)
    expect(res.headers.get('Content-Type'), path).toBe('application/json')
    const body = parseLegacyEnvelope(await res.text())
    expect(Object.keys(body)).toEqual([
      'error',
      'url',
      'statusCode',
      'statusMessage',
      'message',
      'data',
    ])
    expect(body).not.toHaveProperty('ok')
    expect(body.data).toEqual({ path })
  })

  it('answers an unrecognised v0 locale with an empty array at 200 (AE4)', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v0/de`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('[]')
  })

  it('keeps v0 percent-decoding its locale segment through the mount (KTD7)', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v0/%65s`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(legacyDocument('v0/es'))
  })

  it('keeps v1 refusing to decode its datachain_type segment (KTD7, AE10)', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v1/elements/%61i`)
    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = parseLegacyEnvelope(await res.text())
    expect(body.statusCode).toBe(400)
    expect(body.statusMessage).toBe('Invalid datachain_type. Must be "ai" or "device"')
  })

  it('keeps the raw-segment icon guard through the mount', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v0/icons/..%2Findex.svg`)
    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })

  it('sends a non-GET legacy method to the legacy 404 (R21)', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v0/en`, { method: 'POST' })
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(parseLegacyEnvelope(await res.text()).statusCode).toBe(404)
  })

  it('keeps the v1 ?locales= filter working through the mount', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v1/elements/ai?locales=en`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(await res.text()).not.toBe(legacyDocument('v1/elements/ai'))
  })

  it('keeps the preserved 500 on /api/v1/elements?locales= (R10, AE8)', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v1/elements?locales=en`)
    expect(res.status).toBe(500)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = parseLegacyEnvelope(await res.text())
    expect(body.statusMessage).toBe('Server Error')
    expect(body).not.toHaveProperty('errors')
  })
})

describe('legacy mounting: /api/v2 is unchanged', () => {
  it('still answers GET /api/v2/schemas', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v2/schemas`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: true; versions: Array<{ id: string }> }
    expect(body.ok).toBe(true)
    expect(body.versions[0]?.id).toBe(SAMPLE_VERSION.canonical)
  })

  it('still answers the v2 manifest route', async () => {
    const res = await SELF.fetch(
      `${ORIGIN}/api/v2/schemas/${SAMPLE_VERSION.canonical}/manifest`,
    )
    expect(res.status).toBe(200)
  })

  it('still renders the v2 404 envelope for an unknown v2 route', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v2/nope`)
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    const body = (await res.json()) as { ok: false; errors: Array<{ code: string }> }
    expect(body.ok).toBe(false)
    expect(body.errors[0]?.code).toBe('not_found')
  })

  it('still renders the v2 404 envelope outside every mounted prefix', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v3/nope`)
    expect(res.status).toBe(404)
    const body = (await res.json()) as { ok: false; errors: Array<{ code: string }> }
    expect(body.ok).toBe(false)
  })

  it('still answers /healthz', async () => {
    const res = await SELF.fetch(`${ORIGIN}/healthz`)
    expect(res.status).toBe(200)
    expect((await res.json()) as unknown).toEqual({ ok: true, service: 'dtpr-api' })
  })
})

// ----------------------------------------------------------- helpers

/** Read budget the stall cases run under, comfortably under {@link STALL_MS}. */
const BUDGET_MS = 20

/** How long the stalled bucket sleeps before it stops answering at all. */
const STALL_MS = 200

/** Validate budget for the case that proves the two budgets stay apart. */
const VALIDATE_BUDGET_MS = 400

/**
 * Per-case ceiling for the stall cases. A stalled read is unbounded by
 * construction, so a budget that never fires would otherwise hang the
 * case for vitest's whole default timeout.
 */
const STALL_TEST_TIMEOUT_MS = 3_000

/**
 * Bindings whose every R2 read stalls past any read budget.
 *
 * A small budget on its own is not enough to trip the timeout here.
 * Miniflare's local R2 and Cache API settle fast enough that an
 * all-I/O handler outruns even a zero-millisecond `setTimeout`, which
 * is why `test/unit/middleware/timeout.test.ts` makes its slow route
 * sleep on a real timer. This does the same thing one layer down, so
 * the stall sits where production would actually stall.
 *
 * The read sleeps and then never settles, which is deliberate on both
 * counts. The sleep is what keeps a timer pending so the budget can
 * fire; never settling is what keeps the abandoned handler from waking
 * up after its response has already been read and throwing a
 * `ReadableStream is disturbed` TypeError into the log on its way to
 * an `onError` that can no longer do anything with it. Nothing is
 * cached either way — `cachedText` only writes on a non-null load — so
 * no case can prime the cache for the next one.
 */
function stalledBindings(): Env {
  const bucket = {
    get: async () => {
      await new Promise((resolve) => setTimeout(resolve, STALL_MS))
      return new Promise<null>(() => {})
    },
  } as unknown as R2Bucket
  return { ...env, CONTENT: bucket } as unknown as Env
}

/** Bindings whose every rate-limit bucket refuses the request. */
function blockedRateLimit(): Env {
  const binding: RateLimit = { limit: () => Promise.resolve({ success: false }) }
  return {
    ...env,
    RL_READ: binding,
    RL_VALIDATE: binding,
    RL_RESOLVE: binding,
  } as unknown as Env
}
