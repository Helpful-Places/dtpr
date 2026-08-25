import { describe, it, expect, beforeAll } from 'vitest'
import { iconBaseFor } from '../../scripts/capture-legacy.ts'
import { env, SELF } from 'cloudflare:test'
import type { z } from 'zod'
import { LEGACY_V0_LOCALES, type LegacyV0Locale } from '../../src/rest/legacy-v0.ts'
import { LEGACY_V1_DOCUMENT_PATHS } from '../../src/rest/legacy-v1.ts'
import { legacyDocumentKey, legacyIconKey, type LegacyVersion } from '../../src/store/keys.ts'
import {
  LEGACY_DOCUMENT_IDS,
  LEGACY_LOCALE_VARIANTS,
  legacyDocument,
  legacyErrorBodies,
  legacyErrorBody,
  legacyIcon,
  legacyIconIds,
  legacyIcons,
  legacyManifest,
  legacyRawDocument,
  legacyRawDocuments,
  legacyVariant,
  legacyVariants,
} from './legacy-fixtures.ts'
import {
  LEGACY_ERROR_KEYS,
  LEGACY_ERROR_KEYS_WITH_DATA,
  LegacyCategoryDocumentSchema,
  LegacyErrorEnvelopeSchema,
  LegacyTypedElementDocumentSchema,
  LegacyUntypedElementDocumentSchema,
  LegacyV0DocumentSchema,
} from './legacy-schemas.ts'
import { evict } from './legacy-test-helpers.ts'
import { clearBucket } from './seed.ts'

/**
 * U7: the conformance suite. Proof that the frozen surface serves what
 * `dtpr.io` served, and the thing that keeps proving it after the
 * capture window has closed.
 *
 * ## What this suite compares, and why not the obvious thing
 *
 * The tempting comparison is "served bytes == the published artifact
 * under `api/legacy/documents/`". It is worthless. The same
 * `rewriteIconUrls` call produced that artifact, so the identity holds
 * however wrong the rewrite is — the artifact would be being compared
 * to itself (KTD9). Every fidelity assertion below therefore anchors
 * on **`api/legacy/raw/`**, the pre-rewrite capture, and on a rewrite
 * expressed independently here (`rewriteCapture` / `restoreServed`).
 *
 * That gives the three-artifact comparison R11 asks for:
 *
 *   raw capture ──independent rewrite──▶ expected
 *                                          ║
 *   raw capture ──capture script's rewrite──▶ published ──R2──▶ served
 *
 * and all three are asserted equal. `api/test/api/legacy-v1.test.ts`
 * deliberately reuses the capture script's own `rewriteIconUrls`,
 * because there the subject under test is the locale filter and the
 * rewrite is scaffolding. Here the rewrite *is* part of the subject,
 * so it is restated from scratch — structurally, out of the parsed
 * records, rather than by re-running a regex over the text.
 *
 * ## What "no undeclared difference" means here
 *
 * The capture is finite: 11 documents, 36 filtered variants, 4 error
 * envelopes, 148 icons fanned out to 271 objects. Closure is therefore
 * checkable rather than aspirational — this suite asserts byte
 * identity across the *whole* capture, asserts the four R21 departures
 * are present, and asserts (in `covers every captured artifact`) that
 * the sweep actually reaches every fixture U1 wrote. A fifth departure
 * introduced later either breaks a byte comparison or breaks the
 * coverage check.
 *
 * ## Cache hygiene
 *
 * Legacy cache keys carry no version segment (see the caveat in
 * `store/keys.ts`), `caches.default` under vitest-pool-workers is a
 * real Miniflare cache that outlives the per-file R2 isolation, and
 * `test/unit/legacy-loader.test.ts` deliberately writes junk bytes to
 * some of these keys. Every key this suite touches — the ones it seeds
 * *and* the ones it needs to miss — is evicted before anything is
 * written.
 */

const ORIGIN = 'https://example.com'

/** The retired service's origin, and the flat directory it served icons from. */
const LEGACY_ORIGIN = 'https://dtpr.io'
const LEGACY_ICON_DIR = `${LEGACY_ORIGIN}/dtpr-icons`

/**
 * The `schema.namespace` prefix. These strings share the `dtpr.io`
 * host with the icon URLs but are identifiers, not locators, and R2
 * requires them to survive the rewrite verbatim — 367 of them across
 * the v1 documents.
 */
const LEGACY_NAMESPACE_PREFIX = `${LEGACY_ORIGIN}/schemas/`

const V0_ICON_IDS = legacyIconIds('v0')
const V1_ICON_IDS = legacyIconIds('v1')

/** The 25 ids v1 references and v0 does not — R21 departure 2's probe set. */
const V1_ONLY_ICON_IDS = V1_ICON_IDS.filter((id) => !V0_ICON_IDS.includes(id))

/** An id in neither major's set. Matches `LEGACY_ID_REGEX`, so it reaches a real lookup. */
const MISSING_ICON_ID = '__does_not_exist__'

/** An id both majors hold, used wherever a probe needs a hit rather than a miss. */
const PRESENT_ICON_ID = 'accessibility'

/* ------------------------------------------------------------------ *
 * Document identity helpers
 *
 * A document id is `v0/en` or `v1/elements/ai` — the manifest's key,
 * the raw fixture's path, the published artifact's path minus `.json`,
 * and (prefixed with `/api/`) the live route. One string, four uses.
 * ------------------------------------------------------------------ */

function majorOf(id: string): LegacyVersion {
  return id.startsWith('v0/') ? 'v0' : 'v1'
}

function documentKeyOf(id: string): string {
  return legacyDocumentKey(majorOf(id), id.slice(id.indexOf('/') + 1))
}

function routeOf(id: string): string {
  return `/api/${id}`
}

/** Where the frozen surface serves one major's icons from. */
// Two different things that used to be one. `iconPathFor` is the value
// *embedded* in a document — an absolute URL, shared with the capture
// script so a drifted base cannot make the suite agree with itself. The
// transform below stays independently expressed. `iconRouteFor` is the
// path the icon is *requested* at, which is still relative to the host.
function iconPathFor(version: LegacyVersion): string {
  return iconBaseFor(version)
}

function iconRouteFor(version: LegacyVersion): string {
  return `/api/${version}/icons`
}

/* ------------------------------------------------------------------ *
 * The rewrite, expressed independently
 *
 * `scripts/capture-legacy.ts` rewrites with one global regex over the
 * document text. This restatement does the opposite: it parses the
 * document, reads the icon URLs out of the fields that hold them, and
 * replaces each one as a literal string. Different mechanism, same
 * claimed result — which is the only way `rewrite(raw) == served` says
 * anything at all (KTD9).
 *
 * The structural read is also what makes the reverse direction
 * meaningful. `restoreServed` walks the *served* body's icon fields
 * and puts the legacy directory back; if the published rewrite had
 * touched a byte outside an icon URL, the round trip would not
 * reproduce the capture.
 * ------------------------------------------------------------------ */

/** `.svg` filenames the icon routes will accept back. */
const ICON_FILENAME = /^[A-Za-z0-9_-]+\.svg$/

/**
 * Every distinct icon URL a legacy document references, read out of
 * the two fields that carry one: `record.icon` on a v0 record and
 * `record.element.icon.url` on a v1 element record. Category
 * documents reference none, so this returns an empty list for them and
 * the rewrite is the identity — which the manifest independently
 * confirms, since `v1/categories/*` have equal `sha256` and
 * `rawSha256`.
 */
function iconUrlsIn(document: string): string[] {
  const records = JSON.parse(document) as unknown[]
  const urls = new Set<string>()
  for (const record of records) {
    const v0Icon = (record as { icon?: unknown }).icon
    if (typeof v0Icon === 'string') urls.add(v0Icon)
    const v1Icon = (record as { element?: { icon?: { url?: unknown } } }).element?.icon?.url
    if (typeof v1Icon === 'string') urls.add(v1Icon)
  }
  return [...urls]
}

/**
 * Move a set of icon URLs from one directory to another by literal
 * string replacement, leaving every other byte alone.
 *
 * Throws rather than skipping on an unexpected URL: an icon field that
 * does not live under `fromDir`, or whose filename would not survive
 * the icon route's own id guard, means the rewrite's assumptions have
 * stopped holding and a silent no-op would turn that into a passing
 * test.
 */
function moveIconDirectory(
  document: string,
  urls: readonly string[],
  fromDir: string,
  toDir: string,
): string {
  let out = document
  for (const url of urls) {
    if (!url.startsWith(`${fromDir}/`)) {
      throw new Error(`Icon URL outside ${fromDir}: ${url}`)
    }
    const filename = url.slice(fromDir.length + 1)
    if (!ICON_FILENAME.test(filename)) {
      throw new Error(`Icon URL does not name a servable icon: ${url}`)
    }
    out = out.split(url).join(`${toDir}/${filename}`)
  }
  return out
}

/** The published form of a captured document: raw bytes, icon URLs moved. */
function rewriteCapture(raw: string, version: LegacyVersion): string {
  return moveIconDirectory(raw, iconUrlsIn(raw), LEGACY_ICON_DIR, iconPathFor(version))
}

/** The inverse: a served body with the legacy icon directory put back. */
function restoreServed(served: string, version: LegacyVersion): string {
  return moveIconDirectory(served, iconUrlsIn(served), iconPathFor(version), LEGACY_ICON_DIR)
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

/* ------------------------------------------------------------------ *
 * Fixture integrity
 * ------------------------------------------------------------------ */

/**
 * The manifest's hash form, recomputed inside the Worker runtime.
 * Matching it proves the committed fixture bytes are the ones U1
 * captured — without it, a fixture edited after capture would make
 * every byte comparison below agree on the wrong bytes.
 */
async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return `sha256-${[...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`
}

/* ------------------------------------------------------------------ *
 * The captured `?locales=` variants
 * ------------------------------------------------------------------ */

/** The four endpoints that accept `?locales=`, with their variant prefix. */
const TYPED_ENDPOINTS = [
  { id: 'v1/elements/ai', prefix: 'v1_elements_ai' },
  { id: 'v1/elements/device', prefix: 'v1_elements_device' },
  { id: 'v1/categories/ai', prefix: 'v1_categories_ai' },
  { id: 'v1/categories/device', prefix: 'v1_categories_device' },
] as const

/** Every (endpoint, variant) pair — the 36 captured bodies. */
const VARIANT_CASES = TYPED_ENDPOINTS.flatMap(({ id, prefix }) =>
  LEGACY_LOCALE_VARIANTS.map(({ slug, query }) => ({
    name: `${routeOf(id)}${query}`,
    route: `${routeOf(id)}${query}`,
    variantId: `${prefix}__${slug}`,
  })),
)

/* ------------------------------------------------------------------ *
 * The captured error envelopes
 * ------------------------------------------------------------------ */

/**
 * One captured error body, its live probe, and the exact set of fields
 * R14 allows to differ.
 *
 * `pathDerived` is the closure claim per envelope: after substituting
 * the captured `dtpr.io` path for the served one, *nothing* may
 * differ, and before the substitution *only* these fields may. Naming
 * them per capture rather than as one shared list is what makes the
 * 400s and the 500 assert something — their `statusMessage` embeds no
 * path, so for them the differing set is `['url']` alone, and a change
 * that started echoing the request into the message would fail here.
 */
interface ErrorProbe {
  /** Fixture id under `api/legacy/raw/errors/`. */
  id: string
  /** Route on the frozen surface that reproduces it. */
  route: string
  /** The URL `dtpr.io` was asked for when the body was captured. */
  capturedUrl: string
  /** Fields R14 re-derives; every other field must be byte-identical. */
  pathDerived: readonly string[]
  /** Expected key order in the served envelope. */
  keys: readonly string[]
}

const ERROR_PROBES: readonly ErrorProbe[] = [
  {
    id: 'elements-bad-type-400',
    route: '/api/v1/elements/bogus',
    capturedUrl: `${LEGACY_ORIGIN}/api/dtpr/v1/elements/bogus`,
    pathDerived: ['url'],
    keys: LEGACY_ERROR_KEYS,
  },
  {
    id: 'categories-bad-type-400',
    route: '/api/v1/categories/bogus',
    capturedUrl: `${LEGACY_ORIGIN}/api/dtpr/v1/categories/bogus`,
    pathDerived: ['url'],
    keys: LEGACY_ERROR_KEYS,
  },
  {
    id: 'elements-filtered-500',
    route: '/api/v1/elements?locales=en',
    capturedUrl: `${LEGACY_ORIGIN}/api/dtpr/v1/elements?locales=en`,
    pathDerived: ['url'],
    keys: LEGACY_ERROR_KEYS,
  },
  {
    // The legacy icon 404 came from the flat file host, not from
    // `/api/dtpr`, so this is the one capture whose path substitution
    // changes more than the prefix.
    id: 'icon-missing-404',
    route: `/api/v1/icons/${MISSING_ICON_ID}.svg`,
    capturedUrl: `${LEGACY_ORIGIN}/dtpr-icons/${MISSING_ICON_ID}.svg`,
    pathDerived: ['url', 'statusMessage', 'message', 'data'],
    keys: LEGACY_ERROR_KEYS_WITH_DATA,
  },
]

function pathWithQuery(url: string): string {
  const parsed = new URL(url)
  return `${parsed.pathname}${parsed.search}`
}

/**
 * The captured envelope under R14's substitution: the `dtpr.io` URL
 * and path replaced by the ones this deployment answers on.
 *
 * Order matters. The full URL contains the path as a substring, so
 * replacing the path first would leave `https://dtpr.io/api/v1/…` —
 * the right path on the wrong host — and the second pass would find
 * nothing to fix. Doing the URL first is safe in the other direction,
 * because the replacement it inserts no longer contains the captured
 * path.
 */
function underR14Substitution(captured: string, capturedUrl: string, servedUrl: string): string {
  return captured
    .replaceAll(capturedUrl, servedUrl)
    .replaceAll(pathWithQuery(capturedUrl), pathWithQuery(servedUrl))
}

/** Keys whose values differ between two parsed envelopes. */
function differingKeys(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])]
  return keys.filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key])).sort()
}

/**
 * Parse a served body under one of the mirrors, reporting the issues
 * rather than a bare `false`.
 *
 * `expect(() => schema.parse(x)).not.toThrow()` — the idiom
 * `harness-parity.test.ts` uses for the v2 envelope — is the wrong
 * trade here. A v2 shape drift is caught by other assertions anyway;
 * a legacy one might only show up in the mirror, and "expected
 * function not to throw" would leave a reader with no idea which of
 * 149 records lost which field.
 */
function expectConformsTo(schema: z.ZodType, value: unknown, label: string): void {
  const parsed = schema.safeParse(value)
  expect(parsed.success ? [] : parsed.error.issues, label).toEqual([])
}

/* ------------------------------------------------------------------ *
 * Fetch + seed
 * ------------------------------------------------------------------ */

/**
 * Every request goes through `SELF.fetch`, i.e. the deployed
 * `src/index.ts` entry, with a per-request client identity.
 *
 * The identity is not decoration. The legacy mounts carry `/api/v2`'s
 * read rate limit (R17) — 300 requests per minute per caller — and
 * this suite fetches several times that: 271 icons, 11 documents
 * probed five ways each, 36 variants probed twice. Left anonymous it
 * would exhaust the shared bucket partway through and start asserting
 * against 429s, and it would drain the same bucket the other
 * `SELF.fetch` suites draw on. The `DTPR-Client` header is the
 * documented way to ask for a bucket of one's own (see
 * `composeRateKey` in `middleware/rate-limit.ts`), and the legacy
 * handlers neither read it nor echo it.
 *
 * The limiter is deliberately not this suite's subject. It belongs to
 * the mount, and `legacy-mounting.test.ts` proves it with a binding
 * that refuses every request.
 */
let requestSeq = 0

function get(path: string, init: RequestInit = {}): Promise<Response> {
  requestSeq += 1
  const headers = new Headers(init.headers)
  headers.set('DTPR-Client', `dtpr-conformance/${requestSeq}`)
  return SELF.fetch(`${ORIGIN}${path}`, { ...init, headers })
}

async function getText(path: string): Promise<string> {
  return (await get(path)).text()
}

async function getJson<T>(path: string): Promise<T> {
  return JSON.parse(await getText(path)) as T
}

beforeAll(async () => {
  await clearBucket()

  // The published artifact is what U6 uploads, so it is what gets
  // seeded — the expected value on the other side of every comparison
  // comes from `legacy/raw/` instead.
  const writes: Array<readonly [string, string]> = [
    ...LEGACY_DOCUMENT_IDS.map((id) => [documentKeyOf(id), legacyDocument(id)] as const),
    ...V0_ICON_IDS.map((id) => [legacyIconKey('v0', id), legacyIcon(id)] as const),
    ...V1_ICON_IDS.map((id) => [legacyIconKey('v1', id), legacyIcon(id)] as const),
  ]

  await evict([
    ...writes.map(([key]) => key),
    // Keys this suite needs to *miss*. A stale cache entry here would
    // turn R21 departure 2 and the icon 404 envelope green for the
    // wrong reason.
    ...V1_ONLY_ICON_IDS.map((id) => legacyIconKey('v0', id)),
    legacyIconKey('v0', MISSING_ICON_ID),
    legacyIconKey('v1', MISSING_ICON_ID),
  ])

  await Promise.all(writes.map(([key, value]) => env.CONTENT.put(key, value)))
})

/* ------------------------------------------------------------------ *
 * R2 / R11 — served bytes are the rewritten capture
 * ------------------------------------------------------------------ */

describe('legacy conformance: served bytes are the rewritten capture (R2, R11)', () => {
  it.each([...LEGACY_DOCUMENT_IDS])(
    '%s: served bytes equal the independently rewritten raw capture',
    async (id) => {
      const res = await get(routeOf(id))
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(rewriteCapture(legacyRawDocument(id), majorOf(id)))
    },
  )

  it.each([...LEGACY_DOCUMENT_IDS])(
    '%s: reversing the rewrite on the served bytes reproduces the raw capture',
    async (id) => {
      // The other direction of the same claim, and the one that
      // catches a rewrite that changed a byte *outside* an icon URL:
      // restoring the icon directory would then leave that byte
      // changed, and the capture would not come back.
      const served = await getText(routeOf(id))
      expect(restoreServed(served, majorOf(id))).toBe(legacyRawDocument(id))
    },
  )

  it.each([...LEGACY_DOCUMENT_IDS])(
    '%s: the published artifact is the rewritten capture, byte for byte',
    (id) => {
      // The third leg of KTD9's triangle. `legacy/documents/` was
      // produced by the capture script's regex; the right-hand side
      // here is this file's structural restatement. They agree, or the
      // artifact that ships is not the artifact the raw capture
      // implies.
      expect(legacyDocument(id)).toBe(rewriteCapture(legacyRawDocument(id), majorOf(id)))
    },
  )

  it.each([...LEGACY_DOCUMENT_IDS])(
    '%s: only icon URLs moved — every schema.namespace survives (R2)',
    async (id) => {
      const raw = legacyRawDocument(id)
      const served = await getText(routeOf(id))

      // No fetchable dtpr.io URL survives...
      expect(served).not.toContain(`${LEGACY_ICON_DIR}/`)
      // ...and every remaining dtpr.io occurrence is a namespace
      // identifier, at exactly the count the capture had.
      const namespaces = occurrences(raw, LEGACY_NAMESPACE_PREFIX)
      expect(occurrences(served, LEGACY_NAMESPACE_PREFIX)).toBe(namespaces)
      expect(occurrences(served, LEGACY_ORIGIN)).toBe(namespaces)
    },
  )

  it.each([...LEGACY_DOCUMENT_IDS])(
    '%s: served bytes hash to the sha256 the capture manifest recorded',
    async (id) => {
      const recorded = legacyManifest.documents[id]
      expect(recorded, `no manifest entry for ${id}`).toBeDefined()
      expect(await sha256(legacyRawDocument(id))).toBe(recorded?.rawSha256)
      expect(await sha256(await getText(routeOf(id)))).toBe(recorded?.sha256)
    },
  )

  it('serves every v1 document the sub-app publishes, and no others', () => {
    // Drift guard between the capture's document list and the routes
    // `legacy-v1.ts` actually registers.
    const captured = LEGACY_DOCUMENT_IDS.filter((id) => id.startsWith('v1/')).map((id) =>
      id.slice('v1/'.length),
    )
    expect([...captured].sort()).toEqual([...LEGACY_V1_DOCUMENT_PATHS].sort())
  })

  it('serves every v0 locale the sub-app publishes, and no others', () => {
    const captured = LEGACY_DOCUMENT_IDS.filter((id) => id.startsWith('v0/')).map((id) =>
      id.slice('v0/'.length),
    )
    expect([...captured].sort()).toEqual([...LEGACY_V0_LOCALES].sort())
  })
})

describe('legacy conformance: the 36 captured locale variants (R2, R11)', () => {
  it.each(VARIANT_CASES)('$name equals the rewritten $variantId capture', async (testCase) => {
    const res = await get(testCase.route)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(rewriteCapture(legacyVariant(testCase.variantId), 'v1'))
  })

  it.each(VARIANT_CASES)('$name: reversing the rewrite reproduces $variantId', async (testCase) => {
    const served = await getText(testCase.route)
    expect(restoreServed(served, 'v1')).toBe(legacyVariant(testCase.variantId))
  })
})

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */

describe('legacy conformance: icon bytes (R2, R6, R8)', () => {
  // One case per major rather than one per icon: with
  // `isolatedStorage` on, 271 separate cases would each push and pop a
  // storage stack frame for no gain, and `legacy-v1.test.ts` already
  // established the loop-inside-one-case idiom for this fan-out. The
  // explicit timeout is because 148 round trips comfortably outrun
  // vitest's 5 s default.
  it.each([
    { version: 'v0' as const, ids: V0_ICON_IDS, count: 123 },
    { version: 'v1' as const, ids: V1_ICON_IDS, count: 148 },
  ])(
    '$version serves all $count captured icons byte-for-byte',
    async ({ version, ids, count }) => {
      expect(ids).toHaveLength(count)
      for (const id of ids) {
        const res = await get(`${iconRouteFor(version)}/${id}.svg`)
        expect(res.status, `${version} icon ${id}`).toBe(200)
        expect(await res.text(), `${version} icon ${id}`).toBe(legacyIcon(id))
      }
    },
    60_000,
  )

  it('serves the prolog-carrying icons untouched, XML declaration and all (R8)', async () => {
    // Nine of the 148 open with an XML prolog rather than `<svg`. A
    // pipeline that "normalised" the SVGs would strip these first.
    const prologIds = V1_ICON_IDS.filter((id) => !legacyIcon(id).startsWith('<svg'))
    expect(prologIds.length).toBeGreaterThan(0)
    for (const id of prologIds) {
      expect(await getText(`/api/v1/icons/${id}.svg`), id).toBe(legacyIcon(id))
    }
  })

  it('the committed icon bytes hash to the manifest record', async () => {
    for (const id of V1_ICON_IDS) {
      expect(await sha256(legacyIcon(id)), `icon ${id}`).toBe(legacyManifest.icons.hashes[id])
    }
  })

  it('every icon URL a served document carries resolves in its own namespace (R7)', async () => {
    // The rewrite is only worth anything if its output resolves. The
    // sweep above already proved all 271 objects serve their captured
    // bytes, so this asserts *membership* rather than re-fetching the
    // ~900 URLs the documents reference between them: every id must
    // belong to its own major's list, and one live fetch per document
    // closes the loop end to end.
    for (const id of LEGACY_DOCUMENT_IDS) {
      const version = majorOf(id)
      const prefix = `${iconPathFor(version)}/`
      const owned = new Set(legacyIconIds(version))
      const urls = iconUrlsIn(await getText(routeOf(id)))

      if (id.startsWith('v1/categories/')) {
        // Categories reference no icons at all, which is why their
        // published bytes equal their capture exactly.
        expect(urls, id).toEqual([])
        continue
      }

      expect(urls.length, id).toBeGreaterThan(0)
      for (const url of urls) {
        expect(url.startsWith(prefix), `${id} → ${url}`).toBe(true)
        expect(owned.has(url.slice(prefix.length, -'.svg'.length)), `${id} → ${url}`).toBe(true)
      }

      // The embedded value is an absolute URL pointing at this API, which
      // is what lets a cross-origin consumer bind it straight into an
      // <img src>. Assert that, then fetch its path to prove it resolves.
      const probe = urls[0] as string
      const probeUrl = new URL(probe)
      expect(probeUrl.origin, `${id} → ${probe}`).toBe(new URL(iconBaseFor(version)).origin)

      const res = await get(probeUrl.pathname)
      expect(res.status, `${id} → ${probe}`).toBe(200)
      expect(res.headers.get('Content-Type'), `${id} → ${probe}`).toBe('image/svg+xml')
    }
  }, 30_000)
})

/* ------------------------------------------------------------------ *
 * Wire shape — the Zod mirror
 * ------------------------------------------------------------------ */

describe('legacy conformance: wire shape (R2)', () => {
  it.each([...LEGACY_V0_LOCALES])('v0/%s conforms to the v0 record mirror', async (locale) => {
    expectConformsTo(LegacyV0DocumentSchema, await getJson(`/api/v0/${locale}`), `v0/${locale}`)
  })

  it.each(['ai', 'device'])(
    'v1/elements/%s conforms to the typed element mirror',
    async (type) => {
      expectConformsTo(
        LegacyTypedElementDocumentSchema,
        await getJson(`/api/v1/elements/${type}`),
        `elements/${type}`,
      )
    },
  )

  it('the untyped v1/elements conforms to the *unlabelled*-variable mirror (R10)', async () => {
    // Not a stylistic difference from the typed mirror: `variables`
    // here has no `label`, which is precisely why an effective
    // `?locales=` value on this route is a 500. The negative half is
    // the load-bearing one — parsing under the typed schema would mean
    // the defect had been repaired.
    const body = await getJson<unknown>('/api/v1/elements')
    expectConformsTo(LegacyUntypedElementDocumentSchema, body, 'v1/elements')
    expect(LegacyTypedElementDocumentSchema.safeParse(body).success).toBe(false)
  })

  it.each(['ai', 'device'])('v1/categories/%s conforms to the category mirror', async (type) => {
    expectConformsTo(
      LegacyCategoryDocumentSchema,
      await getJson(`/api/v1/categories/${type}`),
      `categories/${type}`,
    )
  })

  it.each(VARIANT_CASES)('$name still conforms to its mirror after filtering', async (testCase) => {
    const schema = testCase.variantId.startsWith('v1_elements_')
      ? LegacyTypedElementDocumentSchema
      : LegacyCategoryDocumentSchema
    expectConformsTo(schema, await getJson(testCase.route), testCase.name)
  })

  it('the v0 mirror rejects a repaired record, so the defects stay pinned', () => {
    // The mirror is only load-bearing if it is strict in the direction
    // R10 cares about. A `headline` back-fill must fail it.
    const [record] = JSON.parse(legacyDocument('v0/en')) as Array<Record<string, unknown>>
    expect(record).toBeDefined()
    expect(LegacyV0DocumentSchema.safeParse([record]).success).toBe(true)
    expect(
      LegacyV0DocumentSchema.safeParse([{ ...record, headline: 'Available for resale' }]).success,
    ).toBe(false)
  })
})

/* ------------------------------------------------------------------ *
 * R10 — the five preserved defects, each asserted PRESENT
 * ------------------------------------------------------------------ */

/**
 * Record counts per v0 locale, hardcoded rather than read off the
 * capture.
 *
 * Deriving them from the fixture would only restate the byte
 * comparison above. Written out, they are a claim about the *defect* —
 * six locales that should hold the same taxonomy and do not — so a
 * future back-fill that made them agree fails here rather than
 * silently improving the frozen surface.
 */
const V0_RECORD_COUNTS: Readonly<Record<LegacyV0Locale, number>> = {
  en: 136,
  fr: 135,
  es: 135,
  tl: 134,
  km: 134,
  pt: 133,
}

/** Records whose `title`/`description` keys are absent, per locale. */
const V0_INCOMPLETE_RECORD_COUNTS: Readonly<Record<LegacyV0Locale, number>> = {
  en: 0,
  fr: 4,
  es: 4,
  tl: 3,
  km: 3,
  pt: 3,
}

interface V0Record {
  id: string
  icon: string
  category: string
  title?: string
  description?: string
}

describe('legacy conformance: R10 defect 1 — v0 omits `headline` entirely', () => {
  it.each([...LEGACY_V0_LOCALES])('v0/%s carries no headline on any record', async (locale) => {
    const records = await getJson<V0Record[]>(`/api/v0/${locale}`)
    expect(records.length).toBeGreaterThan(0)
    for (const record of records) {
      expect(Object.hasOwn(record, 'headline'), `${locale}/${record.id}`).toBe(false)
    }
  })

  it('the string `headline` appears nowhere in any served v0 body', async () => {
    // Blunter than the key check and deliberately so: it also catches
    // a `headline` nested somewhere a record-level check would miss.
    for (const locale of LEGACY_V0_LOCALES) {
      expect(await getText(`/api/v0/${locale}`), locale).not.toContain('headline')
    }
  })
})

describe('legacy conformance: R10 defect 2 — v0 omits `title`/`description` keys', () => {
  it.each([...LEGACY_V0_LOCALES])(
    'v0/%s has exactly the captured number of incomplete records',
    async (locale) => {
      const records = await getJson<V0Record[]>(`/api/v0/${locale}`)
      const missingTitle = records.filter((r) => !Object.hasOwn(r, 'title'))
      const missingDescription = records.filter((r) => !Object.hasOwn(r, 'description'))
      const expected = V0_INCOMPLETE_RECORD_COUNTS[locale]

      expect(missingTitle, `${locale} title`).toHaveLength(expected)
      expect(missingDescription, `${locale} description`).toHaveLength(expected)
      // The keys go missing together — the fallback that would have
      // supplied them never fired for either field.
      expect(missingTitle.map((r) => r.id)).toEqual(missingDescription.map((r) => r.id))
    },
  )

  it('the defect is absent from `en` and present outside it', async () => {
    // The intended behaviour was an English fallback. `en` is complete
    // because it is the source, not because the fallback worked; every
    // other locale is where the fallback would have had to fire.
    const english = await getJson<V0Record[]>('/api/v0/en')
    expect(english.every((r) => Object.hasOwn(r, 'title'))).toBe(true)

    for (const locale of LEGACY_V0_LOCALES.filter((l) => l !== 'en')) {
      const records = await getJson<V0Record[]>(`/api/v0/${locale}`)
      const incomplete = records.filter((r) => !Object.hasOwn(r, 'title'))
      expect(incomplete.length, locale).toBeGreaterThan(0)
      // Not a dropped record — the id is still served, just bare.
      expect(incomplete[0]?.id).toBeTruthy()
      expect(incomplete[0]?.icon).toBeTruthy()
    }
  })
})

describe('legacy conformance: R10 defect 3 — v0 record counts differ per locale', () => {
  it.each([...LEGACY_V0_LOCALES])('v0/%s serves its captured record count', async (locale) => {
    const records = await getJson<V0Record[]>(`/api/v0/${locale}`)
    expect(records).toHaveLength(V0_RECORD_COUNTS[locale])
  })

  it('the six counts do not agree, and `en` is the largest', async () => {
    const counts = await Promise.all(
      LEGACY_V0_LOCALES.map(async (locale) => ({
        locale,
        count: (await getJson<V0Record[]>(`/api/v0/${locale}`)).length,
      })),
    )
    expect(new Set(counts.map((c) => c.count)).size).toBeGreaterThan(1)
    const max = Math.max(...counts.map((c) => c.count))
    expect(counts.find((c) => c.locale === 'en')?.count).toBe(max)
  })
})

describe('legacy conformance: R10 defect 4 — /api/v1/elements 500s on an effective filter', () => {
  it.each(['?locales=en', '?locales=zz', '?locales=,,,', '?locales=en&locales=fr', '?locales=EN'])(
    '%s is an effective value and returns 500',
    async (query) => {
      const res = await get(`/api/v1/elements${query}`)
      expect(res.status).toBe(500)
      expect(res.headers.get('Content-Type')).toBe('application/json')
      const body = JSON.parse(await res.text()) as Record<string, unknown>
      expect(body.statusMessage).toBe('Server Error')
      expect(Array.isArray(body)).toBe(false)
    },
  )

  it.each(['', '?locales=', '?locales', '?other=1'])(
    '%s is not an effective value and returns the full body at 200',
    async (query) => {
      const res = await get(`/api/v1/elements${query}`)
      expect(res.status, query).toBe(200)
      expect(await res.text(), query).toBe(rewriteCapture(legacyRawDocument('v1/elements'), 'v1'))
    },
  )

  it('500s on the trailing-slash form too', async () => {
    expect((await get('/api/v1/elements/?locales=en')).status).toBe(500)
  })

  it('the typed routes filter the same values the untyped route 500s on', async () => {
    // Establishes that the 500 is a property of the untyped document,
    // not of the query: `?locales=en` is perfectly serviceable one
    // route over.
    expect((await get('/api/v1/elements/ai?locales=en')).status).toBe(200)
    expect((await get('/api/v1/elements/device?locales=,,,')).status).toBe(200)
  })
})

interface V1ElementRecord {
  element: { id: string; category_ids: string[] }
}
interface V1CategoryRecord {
  category: { id: string }
}

describe('legacy conformance: R10 defect 5 — cross-type category_ids', () => {
  it('the ai and device category id sets have zero overlap', async () => {
    const ai = await getJson<V1CategoryRecord[]>('/api/v1/categories/ai')
    const device = await getJson<V1CategoryRecord[]>('/api/v1/categories/device')
    const aiIds = new Set(ai.map((r) => r.category.id))
    const deviceIds = new Set(device.map((r) => r.category.id))
    expect([...aiIds].filter((id) => deviceIds.has(id))).toEqual([])
  })

  it.each([
    { type: 'ai', other: 'device' },
    { type: 'device', other: 'ai' },
  ])(
    'every shared element on /elements/$type dangles against /categories/$type',
    async ({ type }) => {
      const elements = await getJson<V1ElementRecord[]>(`/api/v1/elements/${type}`)
      const categories = await getJson<V1CategoryRecord[]>(`/api/v1/categories/${type}`)
      const published = new Set(categories.map((r) => r.category.id))

      const dangling = elements.filter((r) =>
        r.element.category_ids.some((id) => !published.has(id)),
      )
      expect(dangling).toHaveLength(50)
      for (const record of dangling) {
        // Not a total dangle — each still names one category the
        // endpoint does publish, which is why the defect went unnoticed.
        expect(record.element.category_ids.some((id) => published.has(id))).toBe(true)
      }
    },
  )

  it('the dangling elements are exactly the 50 both typed endpoints share', async () => {
    const ai = await getJson<V1ElementRecord[]>('/api/v1/elements/ai')
    const device = await getJson<V1ElementRecord[]>('/api/v1/elements/device')
    const deviceIds = new Set(device.map((r) => r.element.id))
    const shared = ai.map((r) => r.element.id).filter((id) => deviceIds.has(id))
    expect(shared).toHaveLength(50)

    const published = new Set(
      (await getJson<V1CategoryRecord[]>('/api/v1/categories/ai')).map((r) => r.category.id),
    )
    const dangling = ai
      .filter((r) => r.element.category_ids.some((id) => !published.has(id)))
      .map((r) => r.element.id)
    expect([...dangling].sort()).toEqual([...shared].sort())
  })
})

/* ------------------------------------------------------------------ *
 * R14 / R21 departure 1 — error envelopes
 * ------------------------------------------------------------------ */

describe('legacy conformance: captured error envelopes (R14, R21)', () => {
  it.each(ERROR_PROBES)(
    '$id: served bytes equal the capture under the R14 path substitution',
    async (probe) => {
      const res = await get(probe.route)
      const recorded = legacyManifest.errors[probe.id]
      expect(recorded, `no manifest entry for ${probe.id}`).toBeDefined()
      expect(res.status).toBe(recorded?.status)
      expect(res.headers.get('Content-Type')).toBe(recorded?.contentType)

      const expected = underR14Substitution(
        legacyErrorBody(probe.id),
        probe.capturedUrl,
        `${ORIGIN}${probe.route}`,
      )
      expect(await res.text()).toBe(expected)
    },
  )

  it.each(ERROR_PROBES)(
    '$id: only the declared path-derived fields differ from the capture',
    async (probe) => {
      const captured = JSON.parse(legacyErrorBody(probe.id)) as Record<string, unknown>
      const served = JSON.parse(await getText(probe.route)) as Record<string, unknown>

      // Key order is a byte-level property of the pretty-printed
      // envelope, so it is asserted as a sequence, not a set.
      expect(Object.keys(served)).toEqual([...probe.keys])
      expect(Object.keys(captured)).toEqual([...probe.keys])
      expect(differingKeys(served, captured)).toEqual([...probe.pathDerived].sort())
      expect(LegacyErrorEnvelopeSchema.safeParse(served).error?.issues ?? []).toEqual([])
    },
  )

  it.each(ERROR_PROBES)('$id: every path-derived field names this request', async (probe) => {
    const served = JSON.parse(await getText(probe.route)) as {
      url: string
      statusMessage: string
      message: string
      data?: { path: string }
    }
    expect(served.url).toBe(`${ORIGIN}${probe.route}`)
    expect(served.url).not.toContain(LEGACY_ORIGIN)
    expect(served.message).toBe(served.statusMessage)
    if (probe.pathDerived.includes('data')) {
      expect(served.data?.path).toBe(probe.route)
      expect(served.statusMessage).toBe(`Page not found: ${probe.route}`)
    }
  })
})

/* ------------------------------------------------------------------ *
 * R21 — the four departures, and nothing else
 * ------------------------------------------------------------------ */

/**
 * The R21 ledger: every deliberate difference between the frozen
 * surface and what `dtpr.io` served, beyond the one-time icon-URL
 * rewrite baked into the published artifact.
 *
 * This is a closed list of four, driven straight into `it.each` so it
 * cannot become documentation that drifts from the tests. Each entry
 * asserts two things: that the frozen behaviour is what the plan says,
 * and — via the control probes inside each `assert` — that the
 * departure is scoped to the case it names rather than being a
 * general regression.
 */
interface R21Departure {
  id: string
  /** What the retired service did. */
  legacy: string
  /** What the frozen surface does instead. */
  frozen: string
  assert: () => Promise<void>
}

const R21_DEPARTURES: readonly R21Departure[] = [
  {
    id: 'path-re-derivation',
    legacy: 'the captured dtpr.io url/statusMessage/message/data.path',
    frozen: 'all four re-derived from the incoming request (R14)',
    assert: async () => {
      const res = await get('/api/v1/nope?v=2')
      expect(res.status).toBe(404)
      const text = await res.text()
      const body = JSON.parse(text) as {
        url: string
        statusMessage: string
        message: string
        data: { path: string }
      }
      const path = '/api/v1/nope?v=2'
      expect(body.url).toBe(`${ORIGIN}${path}`)
      expect(body.statusMessage).toBe(`Page not found: ${path}`)
      expect(body.message).toBe(`Page not found: ${path}`)
      expect(body.data.path).toBe(path)
      // The capture is what it departs from: none of the dtpr.io
      // values survive.
      expect(text).not.toContain(LEGACY_ORIGIN)
    },
  },
  {
    id: 'v0-namespace-404',
    legacy: 'the single flat /dtpr-icons directory served all 148 ids at 200',
    frozen: 'a v1-only icon id under /api/v0/icons/ is a 404 (R16)',
    assert: async () => {
      expect(V1_ONLY_ICON_IDS).toHaveLength(25)
      for (const id of V1_ONLY_ICON_IDS) {
        const v0 = await get(`/api/v0/icons/${id}.svg`)
        expect(v0.status, `v0 ${id}`).toBe(404)
        expect(v0.headers.get('Content-Type'), `v0 ${id}`).toBe('application/json')
        // Scoped: the same id is a 200 in the namespace that owns it.
        const v1 = await get(`/api/v1/icons/${id}.svg`)
        expect(v1.status, `v1 ${id}`).toBe(200)
        expect(await v1.text(), `v1 ${id}`).toBe(legacyIcon(id))
      }
      // ...and every id v0 *does* reference still resolves under v0.
      expect((await get(`/api/v0/icons/${PRESENT_ICON_ID}.svg`)).status).toBe(200)
    },
  },
  {
    id: 'non-get-404',
    legacy: 'POST answered 200 with the full body on both majors',
    frozen: 'a non-GET method falls through to the legacy 404 (HEAD excepted, below)',
    assert: async () => {
      for (const path of ['/api/v0/en', '/api/v1/elements/ai']) {
        const res = await get(path, { method: 'POST' })
        expect(res.status, `POST ${path}`).toBe(404)
        expect(res.headers.get('Content-Type'), `POST ${path}`).toBe('application/json')
        const body = JSON.parse(await res.text()) as { statusCode: number }
        expect(body.statusCode).toBe(404)
        // Scoped to the method: GET on the same path is untouched.
        expect((await get(path)).status, `GET ${path}`).toBe(200)
      }
    },
  },
  {
    id: 'encoded-icon-id-400',
    legacy: 'the flat file host resolved a percent-encoded id at 200',
    frozen: 'the raw-segment traversal guard rejects it at 400 (KTD7)',
    assert: async () => {
      for (const version of ['v0', 'v1'] as const) {
        const encoded = await get(`${iconRouteFor(version)}/%61ccessibility.svg`)
        expect(encoded.status, `${version} encoded`).toBe(400)
        expect(encoded.headers.get('Content-Type'), `${version} encoded`).toBe('application/json')
        const body = JSON.parse(await encoded.text()) as { statusMessage: string }
        expect(body.statusMessage).toBe('Invalid icon id. Must match [a-zA-Z0-9_-]')
        // Scoped to the encoding: the decoded id is the same 200 it
        // always was.
        const decoded = await get(`${iconRouteFor(version)}/${PRESENT_ICON_ID}.svg`)
        expect(decoded.status, `${version} decoded`).toBe(200)
        expect(await decoded.text()).toBe(legacyIcon(PRESENT_ICON_ID))
      }
    },
  },
]

describe('legacy conformance: the R21 departure ledger', () => {
  it('declares exactly four departures, in the order R21 enumerates them', () => {
    expect(R21_DEPARTURES.map((d) => d.id)).toEqual([
      'path-re-derivation',
      'v0-namespace-404',
      'non-get-404',
      'encoded-icon-id-400',
    ])
  })

  it.each([...R21_DEPARTURES])(
    '$id: $frozen',
    async (departure) => {
      await departure.assert()
    },
    // `v0-namespace-404` probes all 25 v1-only ids in both namespaces.
    30_000,
  )

  it('covers every captured artifact, so the ledger is closed', () => {
    // The claim "no undeclared difference exists" is only checkable
    // because the capture is finite. This asserts the byte-comparison
    // sweep above actually reaches all of it: a fixture U1 wrote that
    // no case here exercises would be an unexamined corner of the
    // surface, and the ledger's closure would be an assumption rather
    // than a result.
    expect([...LEGACY_DOCUMENT_IDS].sort()).toEqual(Object.keys(legacyRawDocuments).sort())
    expect([...LEGACY_DOCUMENT_IDS].sort()).toEqual(Object.keys(legacyManifest.documents).sort())
    expect(VARIANT_CASES.map((c) => c.variantId).sort()).toEqual(Object.keys(legacyVariants).sort())
    expect(ERROR_PROBES.map((p) => p.id).sort()).toEqual(Object.keys(legacyErrorBodies).sort())
    expect(ERROR_PROBES.map((p) => p.id).sort()).toEqual(Object.keys(legacyManifest.errors).sort())
    expect([...new Set([...V0_ICON_IDS, ...V1_ICON_IDS])].sort()).toEqual(
      Object.keys(legacyIcons).sort(),
    )
    expect(Object.keys(legacyIcons)).toHaveLength(148)
  })

  it('the non-GET departure is a route-matching rule, not a POST special case', async () => {
    // Only POST was probed against the live service, so only POST is
    // in the ledger. The other write methods land in the same
    // catch-all for the same reason — `registerBothSlashForms`
    // registers GET alone — and pinning that keeps a later `app.all`
    // from widening the surface unnoticed.
    for (const method of ['PUT', 'DELETE', 'PATCH']) {
      const res = await get('/api/v1/elements/ai', { method })
      expect(res.status, method).toBe(404)
    }
  })

  it('HEAD is answered from the GET route, and is not a fifth departure', async () => {
    // R21's wording ("non-GET methods … the frozen surface 404s
    // them") reads as universal and is not: HEAD never reaches the
    // router at all. Hono's `#dispatch` intercepts it, re-dispatches
    // as GET, and returns `new Response(null, <that response>)` —
    // verified against the vendored Hono 4.12.28. The result is the
    // GET status and headers with an empty body.
    //
    // That is the standard HTTP semantic and what the retired h3
    // service did with a GET-ish handler, so it is conformance rather
    // than a departure — but it is asserted here so the exception is
    // recorded rather than discovered again.
    const head = await get('/api/v1/elements/ai', { method: 'HEAD' })
    const full = await get('/api/v1/elements/ai')

    expect(head.status).toBe(full.status)
    expect(head.status).toBe(200)
    expect(head.headers.get('Content-Type')).toBe(full.headers.get('Content-Type'))
    expect(await head.text()).toBe('')
    expect((await full.text()).length).toBeGreaterThan(0)

    // It mirrors the error routes too, rather than turning them into
    // 404s: the status a GET would have produced survives.
    expect((await get('/api/v1/elements/bogus', { method: 'HEAD' })).status).toBe(400)
    expect((await get('/api/v1/nope', { method: 'HEAD' })).status).toBe(404)
  })
})

/* ------------------------------------------------------------------ *
 * Headers — specific assertions only
 * ------------------------------------------------------------------ */

describe('legacy conformance: response headers (R4)', () => {
  /**
   * Every assertion here names one header.
   *
   * Header-set equality would be the wrong instrument and would fail
   * for reasons that have nothing to do with fidelity: the Worker adds
   * `X-Request-Id` to every response, CORS adds
   * `Access-Control-Allow-Origin`, and the preview environment adds
   * `X-Robots-Tag`. None of those is part of the frozen contract —
   * R2 is a claim about bodies — and asserting the whole set would
   * make the suite fail the moment an unrelated middleware is added.
   */

  it.each([...LEGACY_DOCUMENT_IDS])('%s: bare application/json, no charset', async (id) => {
    expect((await get(routeOf(id))).headers.get('Content-Type')).toBe('application/json')
  })

  it.each([...LEGACY_DOCUMENT_IDS])('%s: no Cache-Control on a document', async (id) => {
    // `legacyJsonBody` deliberately sets none: legacy cache keys carry
    // no version segment, so an immutable header on a document would
    // make a correction unpublishable. The absence is the contract, so
    // it is asserted rather than left implicit.
    expect((await get(routeOf(id))).headers.get('Cache-Control')).toBeNull()
  })

  it('serves filtered variants and error envelopes as bare application/json too', async () => {
    expect((await get('/api/v1/elements/ai?locales=en')).headers.get('Content-Type')).toBe(
      'application/json',
    )
    for (const probe of ERROR_PROBES) {
      expect((await get(probe.route)).headers.get('Content-Type'), probe.id).toBe(
        'application/json',
      )
    }
    // Including the empty-array answer an unknown locale gets (AE4).
    expect((await get('/api/v0/de')).headers.get('Content-Type')).toBe('application/json')
  })

  it.each(['v0', 'v1'] as const)(
    '%s icons: bare image/svg+xml with the immutable cache header',
    async (version) => {
      const res = await get(`${iconRouteFor(version)}/${PRESENT_ICON_ID}.svg`)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('image/svg+xml')
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    },
  )

  it('stamps X-Request-Id on documents, icons and error envelopes alike', async () => {
    for (const path of [
      '/api/v0/en',
      `/api/v1/icons/${PRESENT_ICON_ID}.svg`,
      '/api/v1/elements/bogus',
    ]) {
      const id = (await get(path)).headers.get('X-Request-Id')
      expect(id, path).toBeTruthy()
    }
  })
})
