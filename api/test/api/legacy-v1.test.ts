import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import type { AppEnv } from '../../src/app-types.ts'
import { createLegacyV1App, LEGACY_V1_DOCUMENT_PATHS } from '../../src/rest/legacy-v1.ts'
import { cacheKeyFor } from '../../src/store/cache-wrapper.ts'
import { legacyDocumentKey, legacyIconKey } from '../../src/store/keys.ts'
import { rewriteIconUrls } from '../../scripts/capture-legacy.ts'
import {
  legacyDocument,
  legacyErrorBody,
  legacyIcon,
  legacyIconIds,
  legacyVariant,
} from './legacy-fixtures.ts'
import { clearBucket } from './seed.ts'

/**
 * U4: the frozen `/api/v1` sub-app and its locale filter.
 *
 * The 36 captured variants under `api/legacy/raw/variants/` are the
 * specification for that filter, not a regression net — the legacy
 * service is gone, so there is nothing else to appeal to. Every one is
 * asserted byte-for-byte against the served response here.
 *
 * As in the v0 suite, the sub-app is mounted locally rather than
 * through `src/app.ts` (U5 owns the real mount), which still exercises
 * KTD3's discarded routing options and KTD4's discarded not-found
 * handler and makes the error-envelope paths the ones production
 * emits. Cache hygiene follows the same rule and for the same reason:
 * `test/unit/legacy-loader.test.ts` deliberately writes junk bytes to
 * `legacy/icons/v1/accessibility.svg`, and `caches.default` outlives
 * the isolated R2 storage.
 */

const ORIGIN = 'https://api.dtpr.io'
const MOUNT = '/api/v1'
const ICON_PATH = `${MOUNT}/icons`

const V1_ICON_IDS = legacyIconIds('v1')
const V0_ICON_IDS = legacyIconIds('v0')

/**
 * Every v1 document, derived from the sub-app's own list so the two
 * cannot drift: if a route is added or dropped without the list
 * following, these cases stop covering it.
 */
const V1_DOCUMENT_PATHS: readonly string[] = LEGACY_V1_DOCUMENT_PATHS

/**
 * The nine `?locales=` shapes U1 captured, with the exact query string
 * it sent. Kept as literal query text rather than built from an object
 * because two of them — the bare parameter and the encoded space —
 * cannot survive `URLSearchParams` round-tripping.
 */
const LOCALE_VARIANTS = [
  { slug: 'en', query: '?locales=en' },
  { slug: 'en-fr', query: '?locales=en,fr' },
  { slug: 'zz', query: '?locales=zz' },
  { slug: 'empty', query: '?locales=' },
  { slug: 'bare', query: '?locales' },
  { slug: 'commas', query: '?locales=,,,' },
  { slug: 'space', query: '?locales=en,%20fr' },
  { slug: 'repeated', query: '?locales=en&locales=fr' },
  { slug: 'upper', query: '?locales=EN' },
] as const

/** The four endpoints that accept `?locales=`, with their variant prefix. */
const TYPED_ENDPOINTS = [
  { path: '/elements/ai', prefix: 'v1_elements_ai' },
  { path: '/elements/device', prefix: 'v1_elements_device' },
  { path: '/categories/ai', prefix: 'v1_categories_ai' },
  { path: '/categories/device', prefix: 'v1_categories_device' },
] as const

/** Every (endpoint, variant) pair — the 36 captured bodies. */
const VARIANT_CASES = TYPED_ENDPOINTS.flatMap(({ path, prefix }) =>
  LOCALE_VARIANTS.map(({ slug, query }) => ({
    name: `${path}${query}`,
    path,
    query,
    variantId: `${prefix}__${slug}`,
  })),
)

const INVALID_DATACHAIN_TYPE = 'Invalid datachain_type. Must be "ai" or "device"'

/** An id in neither major's set — a genuine 404 under v1 (R16). */
const UNKNOWN_ICON_ID = '__does_not_exist__'

/**
 * What the served body must equal: the raw capture with the one-time
 * icon rewrite applied. Reusing the capture script's own rewrite is
 * deliberate — U7 is where the independent cross-check lives (KTD9);
 * here the point is that the *filter* reproduces the capture.
 */
function expectedVariant(variantId: string): string {
  return rewriteIconUrls(legacyVariant(variantId), ICON_PATH)
}

function mountedApp() {
  return new Hono<AppEnv>().route(MOUNT, createLegacyV1App())
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
    ...V1_DOCUMENT_PATHS.map(
      (path) => [legacyDocumentKey('v1', path), legacyDocument(`v1/${path}`)] as const,
    ),
    ...V1_ICON_IDS.map((id) => [legacyIconKey('v1', id), legacyIcon(id)] as const),
  ]

  await evict([...writes.map(([key]) => key), legacyIconKey('v1', UNKNOWN_ICON_ID)])
  await Promise.all(writes.map(([key, value]) => env.CONTENT.put(key, value)))
}

beforeAll(primeLegacyBucket)

describe('legacy v1: the five frozen documents', () => {
  it.each(V1_DOCUMENT_PATHS)('serves /%s byte-for-byte as captured', async (path) => {
    const res = await get(`/${path}`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(legacyDocument(`v1/${path}`))
  })

  it('serves JSON as bare application/json, with no charset parameter (R4)', async () => {
    const res = await get('/elements/ai')
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })

  it('embeds icon URLs under its own namespace only (R7)', async () => {
    const res = await get('/elements/ai')
    const records = (await res.json()) as Array<{ element: { icon: { url: string } } }>
    expect(records.length).toBeGreaterThan(0)
    for (const record of records) {
      expect(record.element.icon.url.startsWith(`${ICON_PATH}/`)).toBe(true)
    }
  })

  it('publishes exactly the five documents R1 names, and no more', () => {
    expect([...V1_DOCUMENT_PATHS].sort()).toEqual([
      'categories/ai',
      'categories/device',
      'elements',
      'elements/ai',
      'elements/device',
    ])
  })
})

describe('legacy v1: the 36 captured locale variants (AE1)', () => {
  it.each(VARIANT_CASES)('$name reproduces $variantId byte-for-byte', async (testCase) => {
    const res = await get(`${testCase.path}${testCase.query}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(await res.text()).toBe(expectedVariant(testCase.variantId))
  })
})

describe('legacy v1: locale-filter semantics (R3, AE9)', () => {
  it('returns the full stored body for `?locales=` and a bare `?locales`', async () => {
    const stored = legacyDocument('v1/categories/ai')
    for (const query of ['?locales=', '?locales']) {
      expect(await (await get(`/categories/ai${query}`)).text()).toBe(stored)
    }
  })

  it('empties every locale array for `?locales=,,,`', async () => {
    const records = (await (await get('/categories/ai?locales=,,,')).json()) as Array<{
      category: { id: string; name: unknown[]; description: unknown[] }
    }>
    expect(records.length).toBeGreaterThan(0)
    for (const record of records) {
      expect(record.category.name).toEqual([])
      expect(record.category.description).toEqual([])
    }
  })

  it('drops the space-prefixed locale for `?locales=en,%20fr`', async () => {
    const records = (await (await get('/categories/ai?locales=en,%20fr')).json()) as Array<{
      category: { name: Array<{ locale: string }> }
    }>
    const locales = new Set(records.flatMap((r) => r.category.name.map((n) => n.locale)))
    expect(locales).toEqual(new Set(['en']))
  })

  it('applies both values of a repeated `locales` parameter', async () => {
    const records = (await (await get('/categories/ai?locales=en&locales=fr')).json()) as Array<{
      category: { name: Array<{ locale: string }> }
    }>
    const locales = new Set(records.flatMap((r) => r.category.name.map((n) => n.locale)))
    expect(locales).toEqual(new Set(['en', 'fr']))
  })

  it('is case-sensitive: `?locales=EN` empties everything', async () => {
    const records = (await (await get('/categories/ai?locales=EN')).json()) as Array<{
      category: { name: unknown[] }
    }>
    for (const record of records) expect(record.category.name).toEqual([])
  })

  it('keeps every record present for a locale the content lacks (AE2)', async () => {
    const stored = JSON.parse(legacyDocument('v1/elements/ai')) as Array<{
      element: { id: string }
    }>
    const res = await get('/elements/ai?locales=zz')
    expect(res.status).toBe(200)
    const records = (await res.json()) as Array<{
      element: { id: string; title: unknown[]; description: unknown[] }
    }>
    expect(records.map((r) => r.element.id)).toEqual(stored.map((r) => r.element.id))
    for (const record of records) {
      expect(record.element.title).toEqual([])
      expect(record.element.description).toEqual([])
    }
  })

  it('never rewrites an icon URL while filtering', async () => {
    const records = (await (await get('/elements/device?locales=en')).json()) as Array<{
      element: { icon: { url: string } }
    }>
    for (const record of records) {
      expect(record.element.icon.url.startsWith(`${ICON_PATH}/`)).toBe(true)
    }
  })
})

describe('legacy v1: the untyped /elements 500 (R10, AE8)', () => {
  it('reproduces the captured 500 envelope with the url re-derived (R14)', async () => {
    const res = await get('/elements?locales=en')
    expect(res.status).toBe(500)
    expect(res.headers.get('Content-Type')).toBe('application/json')

    const expected = legacyErrorBody('elements-filtered-500').replaceAll(
      'https://dtpr.io/api/dtpr/v1/elements?locales=en',
      `${ORIGIN}${MOUNT}/elements?locales=en`,
    )
    expect(await res.text()).toBe(expected)
  })

  it('500s for any effective locales value, not just `en`', async () => {
    for (const query of ['?locales=en', '?locales=zz', '?locales=,,,', '?locales=en&locales=fr']) {
      const res = await get(`/elements${query}`)
      expect(res.status, query).toBe(500)
    }
  })

  it('serves the full body when the value is not effective', async () => {
    const stored = legacyDocument('v1/elements')
    for (const query of ['', '?locales=', '?locales', '?other=1']) {
      const res = await get(`/elements${query}`)
      expect(res.status, query).toBe(200)
      expect(await res.text(), query).toBe(stored)
    }
  })

  it('500s on the trailing-slash form too', async () => {
    expect((await get('/elements/?locales=en')).status).toBe(500)
  })

  it('preserves the defect rather than filtering: the body is an error, not a document', async () => {
    const body = JSON.parse(await (await get('/elements?locales=en')).text()) as Record<
      string,
      unknown
    >
    expect(Array.isArray(body)).toBe(false)
    expect(body.statusMessage).toBe('Server Error')
    expect(body.message).toBe('Server Error')
    expect(Object.keys(body)).toEqual(['error', 'url', 'statusCode', 'statusMessage', 'message'])
  })
})

describe('legacy v1: datachain_type validation (R15, AE3, AE10, AE14)', () => {
  it.each(['/elements/bogus', '/categories/bogus'])(
    '%s returns the captured 400 envelope with the url re-derived',
    async (path) => {
      const res = await get(path)
      expect(res.status).toBe(400)
      expect(res.headers.get('Content-Type')).toBe('application/json')

      const slug = path.startsWith('/elements') ? 'elements' : 'categories'
      const expected = legacyErrorBody(`${slug}-bad-type-400`).replaceAll(
        `https://dtpr.io/api/dtpr/v1/${slug}/bogus`,
        `${ORIGIN}${MOUNT}${path}`,
      )
      expect(await res.text()).toBe(expected)
    },
  )

  it('carries the legacy statusMessage verbatim (AE3)', async () => {
    const body = JSON.parse(await (await get('/elements/bogus')).text()) as {
      statusMessage: string
      message: string
    }
    expect(body.statusMessage).toBe(INVALID_DATACHAIN_TYPE)
    expect(body.message).toBe(INVALID_DATACHAIN_TYPE)
  })

  it('does NOT percent-decode: /elements/%61i is 400, not `ai` (R15, AE10)', async () => {
    const { bucket, reads } = countingBucket(env.CONTENT)
    const ctx = createExecutionContext()
    const res = await app.fetch(
      new Request(`${ORIGIN}${MOUNT}/elements/%61i`),
      withBucket(bucket),
      ctx,
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(400)
    // The 400 has to precede the key builder, or the raw-segment rule
    // is decorative.
    expect(reads()).toBe(0)
  })

  it('does not decode on the categories route either', async () => {
    expect((await get('/categories/%61i')).status).toBe(400)
    expect((await get('/categories/%64evice')).status).toBe(400)
  })

  it('echoes the incoming request in the error url, not the captured host (AE14)', async () => {
    const body = JSON.parse(await (await get('/elements/%61i?locales=en')).text()) as {
      url: string
    }
    expect(body.url).toBe(`${ORIGIN}${MOUNT}/elements/%61i?locales=en`)
    expect(body.url).not.toContain('dtpr.io/api/dtpr')
  })

  it('rejects a traversal attempt before any key builder runs', async () => {
    const { bucket, reads } = countingBucket(env.CONTENT)
    const ctx = createExecutionContext()
    const res = await app.fetch(
      new Request(`${ORIGIN}${MOUNT}/categories/..%2F..%2Fschemas`),
      withBucket(bucket),
      ctx,
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(400)
    expect(reads()).toBe(0)
  })
})

describe('legacy v1: trailing slashes (R15, AE10, KTD3)', () => {
  it.each(['/elements', '/elements/ai', '/elements/device', '/categories/ai', '/categories/device'])(
    '%s/ resolves to the unslashed response',
    async (path) => {
      const unslashed = await (await get(path)).text()
      const res = await get(`${path}/`)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/json')
      expect(await res.text()).toBe(unslashed)
    },
  )

  it('filters identically on the slashed form', async () => {
    const res = await get('/elements/ai/?locales=en')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(expectedVariant('v1_elements_ai__en'))
  })

  it('400s the slashed form of an invalid type', async () => {
    expect((await get('/elements/bogus/')).status).toBe(400)
  })
})

describe('legacy v1: icons', () => {
  it('serves every one of the 148 v1 icons byte-for-byte (R6)', async () => {
    expect(V1_ICON_IDS).toHaveLength(148)
    for (const id of V1_ICON_IDS) {
      const res = await get(`/icons/${id}.svg`)
      expect(res.status, `icon ${id}`).toBe(200)
      expect(await res.text(), `icon ${id}`).toBe(legacyIcon(id))
    }
  })

  it('carries v0’s whole set, so nothing regressed at the namespace split', () => {
    for (const id of V0_ICON_IDS) expect(V1_ICON_IDS).toContain(id)
  })

  it('resolves the icon URL a v1 record actually carries (R7)', async () => {
    const records = (await (await get('/elements/ai')).json()) as Array<{
      element: { icon: { url: string } }
    }>
    const iconPath = records[0]?.element.icon.url ?? ''
    expect(iconPath).toMatch(/^\/api\/v1\/icons\/.+\.svg$/)

    const ctx = createExecutionContext()
    const res = await app.fetch(new Request(`${ORIGIN}${iconPath}`), env, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    const id = iconPath.slice(`${ICON_PATH}/`.length, -'.svg'.length)
    expect(await res.text()).toBe(legacyIcon(id))
  })

  it('serves the flat file untouched, XML prolog and all (R8)', async () => {
    const prologId = V1_ICON_IDS.find((id) => !legacyIcon(id).startsWith('<svg'))
    expect(prologId, 'no prolog-carrying icon in the v1 set').toBeDefined()
    const res = await get(`/icons/${prologId}.svg`)
    expect(await res.text()).toBe(legacyIcon(prologId as string))
  })

  it('resolves a trailing slash on the icon route too (R15)', async () => {
    const res = await get('/icons/accessibility.svg/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(legacyIcon('accessibility'))
  })

  it('404s an unknown icon id (R16)', async () => {
    const res = await get(`/icons/${UNKNOWN_ICON_ID}.svg`)
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })

  it('404s an icon path with no .svg suffix', async () => {
    expect((await get('/icons/accessibility')).status).toBe(404)
  })

  it('400s a percent-encoded icon id, guarding the raw segment (KTD7, AE15)', async () => {
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
})

describe('legacy v1: the catch-all 404 (KTD4, R14)', () => {
  it('answers an unmatched path with the legacy envelope, not the v2 one', async () => {
    const res = await get('/elements/ai/extra')
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
    expect(body.data).toEqual({ path: `${MOUNT}/elements/ai/extra` })
  })

  it('404s the untyped /categories, which the legacy service never published', async () => {
    for (const path of ['/categories', '/categories/']) {
      const res = await get(path)
      expect(res.status, path).toBe(404)
    }
  })

  it('re-derives all four path-derived fields from the incoming request (R14, AE14)', async () => {
    const path = `${MOUNT}/nope?v=2`
    const res = await get('/nope?v=2')
    const body = JSON.parse(await res.text()) as {
      url: string
      statusMessage: string
      message: string
      data: { path: string }
    }
    expect(body.url).toBe(`${ORIGIN}${path}`)
    expect(body.statusMessage).toBe(`Page not found: ${path}`)
    expect(body.message).toBe(`Page not found: ${path}`)
    expect(body.data.path).toBe(path)
  })

  it('sends a non-GET method to the legacy 404 (R21 departure)', async () => {
    const ctx = createExecutionContext()
    const res = await app.fetch(
      new Request(`${ORIGIN}${MOUNT}/elements/ai`, { method: 'POST' }),
      env,
      ctx,
    )
    await waitOnExecutionContext(ctx)
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })
})

describe('legacy v1: a document whose object is missing', () => {
  const key = legacyDocumentKey('v1', 'categories/device')

  beforeAll(async () => {
    await evict([key])
    await env.CONTENT.delete(key)
  })

  afterAll(async () => {
    await env.CONTENT.put(key, legacyDocument('v1/categories/device'))
  })

  it('answers in the legacy shape rather than the house envelope', async () => {
    const res = await get('/categories/device')
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = JSON.parse(await res.text()) as { data: { path: string } }
    expect(body.data.path).toBe(`${MOUNT}/categories/device`)
  })

  it('does not attempt to filter a document it could not load', async () => {
    const res = await get('/categories/device?locales=en')
    expect(res.status).toBe(404)
  })
})
