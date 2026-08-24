import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import type { AppEnv } from '../../src/app-types.ts'
import { createLegacyV0App, LEGACY_V0_LOCALES } from '../../src/rest/legacy-v0.ts'
import { cacheKeyFor } from '../../src/store/cache-wrapper.ts'
import { legacyDocumentKey, legacyIconKey } from '../../src/store/keys.ts'
import {
  legacyDocument,
  legacyErrorBody,
  legacyIcon,
  legacyIconIds,
} from './legacy-fixtures.ts'
import { clearBucket } from './seed.ts'

/**
 * U3: the frozen `/api/v0` sub-app.
 *
 * The sub-app is mounted here rather than in `src/app.ts` — U5 owns
 * the real mount and its middleware posture. Mounting it locally still
 * exercises the two things `app.route()` is known to break (KTD3's
 * discarded routing options, KTD4's discarded not-found handler) and
 * makes the paths in the error envelopes the ones production will
 * emit.
 *
 * Cache hygiene matters more here than in a v2 suite. Legacy cache
 * keys carry no version segment (see the caveat in `store/keys.ts`),
 * `caches.default` under vitest-pool-workers is a real Miniflare
 * cache, and `test/unit/legacy-loader.test.ts` writes deliberately
 * junk bytes to `legacy/documents/v0/en.json` and
 * `legacy/icons/v0/aggregated.svg`. `primeLegacyBucket` therefore
 * evicts every key this suite touches — the ones it seeds *and* the
 * ones it expects to miss — before writing anything.
 */

const ORIGIN = 'https://api.dtpr.io'
const MOUNT = '/api/v0'

const V0_ICON_IDS = legacyIconIds('v0')
const V1_ONLY_ICON_IDS = legacyIconIds('v1').filter((id) => !V0_ICON_IDS.includes(id))

/** One id that exists only in v1's set — a genuine 404 under v0 (R16). */
const V1_ONLY_ICON_ID = 'dm_accept-or-deny'

function mountedApp() {
  return new Hono<AppEnv>().route(MOUNT, createLegacyV0App())
}

const app = mountedApp()

async function get(path: string, bindings: Env = env): Promise<Response> {
  const ctx = createExecutionContext()
  const res = await app.fetch(new Request(`${ORIGIN}${MOUNT}${path}`), bindings, ctx)
  await waitOnExecutionContext(ctx)
  return res
}

/** Wraps a bucket to count `get` calls — the only method the loaders use. */
function countingBucket(inner: R2Bucket): { bucket: R2Bucket; reads: () => number } {
  let reads = 0
  const bucket = {
    get: (key: string) => {
      reads += 1
      return inner.get(key)
    },
  } as unknown as R2Bucket
  return { bucket, reads: () => reads }
}

function withBucket(bucket: R2Bucket): Env {
  return { ...env, CONTENT: bucket }
}

async function evict(keys: readonly string[]): Promise<void> {
  await Promise.all(keys.map((key) => caches.default.delete(cacheKeyFor(key))))
}

async function primeLegacyBucket(): Promise<void> {
  await clearBucket()

  const writes: Array<readonly [string, string]> = [
    ...LEGACY_V0_LOCALES.map(
      (locale) => [legacyDocumentKey('v0', locale), legacyDocument(`v0/${locale}`)] as const,
    ),
    ...V0_ICON_IDS.map((id) => [legacyIconKey('v0', id), legacyIcon(id)] as const),
    // v1's exclusive ids, seeded under v1 only. Their absence from the
    // v0 namespace is the assertion, so they have to exist somewhere.
    ...V1_ONLY_ICON_IDS.map((id) => [legacyIconKey('v1', id), legacyIcon(id)] as const),
  ]

  await evict([
    ...writes.map(([key]) => key),
    ...V1_ONLY_ICON_IDS.map((id) => legacyIconKey('v0', id)),
  ])
  await Promise.all(writes.map(([key, value]) => env.CONTENT.put(key, value)))
}

beforeAll(primeLegacyBucket)

describe('legacy v0: locale documents', () => {
  it.each(LEGACY_V0_LOCALES)('serves /%s byte-for-byte as captured', async (locale) => {
    const res = await get(`/${locale}`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(legacyDocument(`v0/${locale}`))
  })

  it('serves JSON as bare application/json, with no charset parameter', async () => {
    const res = await get('/en')
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })

  it.each(LEGACY_V0_LOCALES)(
    'preserves the missing-headline defect in /%s (R10)',
    async (locale) => {
      const res = await get(`/${locale}`)
      const records = (await res.json()) as Array<Record<string, unknown>>
      expect(records.length).toBeGreaterThan(0)
      for (const record of records) {
        expect(Object.hasOwn(record, 'headline')).toBe(false)
      }
    },
  )

  it('embeds icon URLs under its own namespace only (R7)', async () => {
    const res = await get('/en')
    const records = (await res.json()) as Array<{ icon: string }>
    for (const record of records) {
      expect(record.icon.startsWith('/api/v0/icons/')).toBe(true)
    }
  })
})

describe('legacy v0: request-shape handling', () => {
  it('answers an unrecognised locale with an empty array at 200 (AE4)', async () => {
    for (const path of ['/de', '/zz', '/EN']) {
      const res = await get(path)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/json')
      expect(await res.text()).toBe('[]')
    }
  })

  it('resolves a trailing slash to the unslashed response (AE10)', async () => {
    const res = await get('/en/')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(await res.text()).toBe(legacyDocument('v0/en'))
  })

  it('percent-decodes the locale segment: /%65s is the full es body (AE13)', async () => {
    const res = await get('/%65s')
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).not.toBe('[]')
    expect(body).toBe(legacyDocument('v0/es'))
  })

  it('decodes on the slashed form too', async () => {
    const res = await get('/%65s/')
    expect(await res.text()).toBe(legacyDocument('v0/es'))
  })

  it('ignores ?locales entirely (R3)', async () => {
    const plain = await (await get('/en')).text()
    for (const query of ['?locales=en', '?locales=', '?locales=fr,km', '?locales']) {
      const res = await get(`/en${query}`)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/json')
      expect(await res.text()).toBe(plain)
    }
  })

  it('treats a bare /icons as a locale, exactly as the legacy handler did', async () => {
    // Single segment, so it matches `/:locale`, misses the allowlist,
    // and answers `[]` — the same thing `/api/dtpr/v0/icons` did.
    const res = await get('/icons')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('[]')
  })
})

describe('legacy v0: icons', () => {
  it('serves every one of the 123 v0 icons byte-for-byte (R6)', async () => {
    expect(V0_ICON_IDS).toHaveLength(123)
    for (const id of V0_ICON_IDS) {
      const res = await get(`/icons/${id}.svg`)
      expect(res.status, `icon ${id}`).toBe(200)
      expect(await res.text(), `icon ${id}`).toBe(legacyIcon(id))
    }
  })

  it('resolves the icon URL a v0 record actually carries (AE5)', async () => {
    const records = (await (await get('/en')).json()) as Array<{ icon: string }>
    const iconPath = records[0]?.icon ?? ''
    expect(iconPath).toMatch(/^\/api\/v0\/icons\/.+\.svg$/)

    const ctx = createExecutionContext()
    const res = await app.fetch(new Request(`${ORIGIN}${iconPath}`), env, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    const id = iconPath.slice('/api/v0/icons/'.length, -'.svg'.length)
    expect(await res.text()).toBe(legacyIcon(id))
  })

  it('serves the flat file untouched, XML prolog and all (R8)', async () => {
    // Nine captured icons open with an XML prolog rather than `<svg`.
    // Composition or re-serialisation would eat it.
    const prologId = V0_ICON_IDS.find((id) => !legacyIcon(id).startsWith('<svg'))
    expect(prologId, 'no prolog-carrying icon in the v0 set').toBeDefined()
    const res = await get(`/icons/${prologId}.svg`)
    expect(await res.text()).toBe(legacyIcon(prologId as string))
  })

  it('resolves a trailing slash on the icon route too (R15)', async () => {
    const res = await get('/icons/accessibility.svg/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(legacyIcon('accessibility'))
  })

  it('404s a v1-only icon id: the namespaces do not fall through (AE11, R16)', async () => {
    expect(V1_ONLY_ICON_IDS).toHaveLength(25)
    expect(V1_ONLY_ICON_IDS).toContain(V1_ONLY_ICON_ID)
    // Present in v1's namespace, so this is isolation and not an
    // upload gap. `head` rather than `get`: an unread `R2ObjectBody`
    // leaves a stream open and the pool's isolated-storage teardown
    // fails on it.
    expect(await env.CONTENT.head(legacyIconKey('v1', V1_ONLY_ICON_ID))).not.toBeNull()

    const res = await get(`/icons/${V1_ONLY_ICON_ID}.svg`)
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })

  it('404s every v1-only id under the v0 namespace', async () => {
    for (const id of V1_ONLY_ICON_IDS) {
      const res = await get(`/icons/${id}.svg`)
      expect(res.status, `icon ${id}`).toBe(404)
    }
  })

  it('404s an icon path with no .svg suffix', async () => {
    const res = await get('/icons/accessibility')
    expect(res.status).toBe(404)
  })
})

describe('legacy v0: guards and the legacy 404 envelope', () => {
  it('rejects a traversal attempt with 400 before any key builder runs', async () => {
    const { bucket, reads } = countingBucket(env.CONTENT)
    const ctx = createExecutionContext()
    const res = await app.fetch(
      new Request(`${ORIGIN}${MOUNT}/icons/..%2Findex.svg`),
      withBucket(bucket),
      ctx,
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(reads()).toBe(0)
  })

  it('guards the raw segment, not the decoded one (KTD7)', async () => {
    // `%61ccessibility` decodes to a perfectly valid id. Hono hands
    // handlers the decoded form, so a guard written against
    // `c.req.param()` would serve this at 200; the raw-segment guard
    // rejects it. This assertion is the one that fails if someone
    // "simplifies" the icon route back onto the param.
    const { bucket, reads } = countingBucket(env.CONTENT)
    const ctx = createExecutionContext()
    const res = await app.fetch(
      new Request(`${ORIGIN}${MOUNT}/icons/%61ccessibility.svg`),
      withBucket(bucket),
      ctx,
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(400)
    expect(reads()).toBe(0)
  })

  it('renders the 400 in the legacy envelope, without a data member', async () => {
    const res = await get('/icons/..%2Findex.svg')
    const body = JSON.parse(await res.text()) as Record<string, unknown>
    expect(Object.keys(body)).toEqual(['error', 'url', 'statusCode', 'statusMessage', 'message'])
    expect(body.error).toBe(true)
    expect(body.statusCode).toBe(400)
    expect(body.message).toBe(body.statusMessage)
    expect(body.url).toBe(`${ORIGIN}${MOUNT}/icons/..%2Findex.svg`)
  })

  it('reproduces the captured 404 envelope with the path re-derived (R14, AE14)', async () => {
    const path = `${MOUNT}/icons/${V1_ONLY_ICON_ID}.svg`
    const res = await get(`/icons/${V1_ONLY_ICON_ID}.svg`)
    expect(res.status).toBe(404)

    // Byte-compare against the capture under the R14 substitution:
    // the full-URL replacement runs first so it isn't clipped by the
    // path replacement. Everything else — two-space indent, key
    // order, absent trailing newline — has to match on its own.
    const expected = legacyErrorBody('icon-missing-404')
      .replaceAll('https://dtpr.io/dtpr-icons/__does_not_exist__.svg', `${ORIGIN}${path}`)
      .replaceAll('/dtpr-icons/__does_not_exist__.svg', path)
    expect(await res.text()).toBe(expected)
  })

  it('carries the query string into the path-derived fields', async () => {
    // The legacy 404 came from vue-router's `to.fullPath`, which
    // includes the query.
    const res = await get(`/icons/${V1_ONLY_ICON_ID}.svg?v=2`)
    const body = JSON.parse(await res.text()) as { data: { path: string }; message: string }
    expect(body.data.path).toBe(`${MOUNT}/icons/${V1_ONLY_ICON_ID}.svg?v=2`)
    expect(body.message).toBe(`Page not found: ${MOUNT}/icons/${V1_ONLY_ICON_ID}.svg?v=2`)
  })

  it('answers an unmatched path with the legacy 404, not the v2 envelope (KTD4)', async () => {
    const res = await get('/en/extra/deep')
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = JSON.parse(await res.text()) as Record<string, unknown>
    expect(Object.keys(body)).toEqual([
      'error',
      'url',
      'statusCode',
      'statusMessage',
      'message',
      'data',
    ])
    expect(body).not.toHaveProperty('ok')
    expect(body).not.toHaveProperty('errors')
    expect(body.data).toEqual({ path: `${MOUNT}/en/extra/deep` })
  })

  it('sends a non-GET method to the legacy 404 (R21 departure)', async () => {
    const ctx = createExecutionContext()
    const res = await app.fetch(
      new Request(`${ORIGIN}${MOUNT}/en`, { method: 'POST' }),
      env,
      ctx,
    )
    await waitOnExecutionContext(ctx)
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })
})

describe('legacy v0: an allowlisted locale whose object is missing', () => {
  const key = legacyDocumentKey('v0', 'km')

  beforeAll(async () => {
    // Evict *and* delete: earlier cases in this file have already
    // populated the cache entry for this key, and a cached hit would
    // answer the request before the loader saw the empty bucket.
    await evict([key])
    await env.CONTENT.delete(key)
  })

  afterAll(async () => {
    await env.CONTENT.put(key, legacyDocument('v0/km'))
  })

  it('answers in the legacy shape rather than the house envelope', async () => {
    const res = await get('/km')
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = JSON.parse(await res.text()) as { data: { path: string } }
    expect(body.data.path).toBe(`${MOUNT}/km`)
  })
})
