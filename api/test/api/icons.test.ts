import { describe, it, expect, beforeEach } from 'vitest'
import { env, SELF } from 'cloudflare:test'
import { composeIcon } from '../../src/icons/compositor.ts'
import type { Category } from '../../src/schema/category.ts'
import type { Element } from '../../src/schema/element.ts'
import {
  _resetInlineBundles,
  registerInlineBundle,
  type SchemaIndex,
} from '../../src/store/index.ts'
import { INDEX_KEY } from '../../src/store/keys.ts'
import {
  SAMPLE_BETA_VERSION,
  SAMPLE_VERSION,
  clearBucket,
  makeDatachainType,
  makeManifest,
} from './seed.ts'

// Real symbol SVG pulled from the ported AI schema fixture. We use
// the file contents rather than a synthetic string so the cache-
// control tests are exercising a realistic payload — and so that if
// the fixture ever drifts, the body-byte assertion catches it.
import acceptDenySymbolRaw from '../fixtures/schemas/ai/2026-04-16-beta/symbols/accept_deny.svg?raw'

const loc = (locale: 'en' | 'fr', value: string) => ({ locale, value })

// The minimum category + element shape the icon routes need. We
// intentionally keep this tighter than the seed.ts defaults because
// those don't carry a `context.values` entry — which Unit 8 will need
// once composed-icon variants land — so we define our own here rather
// than forking seed.ts.
function makeIconCategories(): Category[] {
  return [
    {
      id: 'ai__decision',
      name: [loc('en', 'Decision'), loc('fr', 'Décision')],
      description: [
        loc('en', 'How decisions get made.'),
        loc('fr', 'Comment les décisions sont prises.'),
      ],
      prompt: [],
      required: true,
      order: 1,
      datachain_type: 'ai',
      shape: 'hexagon',
      element_variables: [],
      context: {
        id: 'actor',
        name: [loc('en', 'Actor')],
        description: [loc('en', 'Who made the decision.')],
        values: [
          {
            id: 'ai_only',
            name: [loc('en', 'AI only')],
            description: [loc('en', 'Autonomous decision.')],
            color: '#F28C28',
          },
        ],
      },
    },
  ]
}

function makeIconElements(): Element[] {
  return [
    {
      id: 'accept_deny',
      category_id: 'ai__decision',
      title: [loc('en', 'Accept / Deny'), loc('fr', 'Accepter / Refuser')],
      description: [
        loc('en', 'Binary outcome: yes or no.'),
        loc('fr', 'Résultat binaire: oui ou non.'),
      ],
      citation: [],
      symbol_id: 'dm_accept-or-deny',
      variables: [],
    },
  ]
}

interface SeedOverrides {
  /** Override the default category set (e.g. drop the context dimension). */
  categories?: Category[]
  /** Override the default element set. */
  elements?: Element[]
  /** Override the symbols registered inline. */
  symbols?: Record<string, string>
  /** Override the composed-icons map keyed by `<element_id>/<variant>`. */
  composedIcons?: Record<string, string>
}

/**
 * Register inline bundles for both the beta and stable sample
 * versions, and write a schemas/index.json that lists both so
 * `resolveKnownVersion` accepts them. Inline bundles short-circuit
 * the R2 loaders for symbols, so we don't need to seed SVG blobs in
 * R2 itself — mirroring what `schema:build` will emit once the
 * inline-bundle pipeline is wired.
 *
 * Overrides apply to BOTH the beta and stable bundles so tests can
 * swap in e.g. a context-free category once without having to repeat
 * themselves. The two versions share the same inline payload except
 * for the manifest status, mirroring the real fixture shape.
 */
async function seedIconBundles(overrides: SeedOverrides = {}): Promise<void> {
  await clearBucket()
  const betaManifest = makeManifest(SAMPLE_BETA_VERSION)
  const stableManifest = makeManifest(SAMPLE_VERSION)
  const categories = overrides.categories ?? makeIconCategories()
  const elements = overrides.elements ?? makeIconElements()
  const symbols = overrides.symbols ?? {
    'dm_accept-or-deny': acceptDenySymbolRaw,
  }
  const composedIcons = overrides.composedIcons ?? {}

  registerInlineBundle(SAMPLE_BETA_VERSION.canonical, {
    manifest: betaManifest,
    datachainType: makeDatachainType(),
    categories,
    elements,
    schemaJson: {},
    searchIndexesByLocale: {},
    symbols,
    composedIcons,
  })

  registerInlineBundle(SAMPLE_VERSION.canonical, {
    manifest: stableManifest,
    datachainType: makeDatachainType(),
    categories,
    elements,
    schemaJson: {},
    searchIndexesByLocale: {},
    symbols,
    composedIcons,
  })

  const index: SchemaIndex = {
    versions: [
      {
        id: betaManifest.version,
        status: betaManifest.status,
        created_at: betaManifest.created_at,
        content_hash: betaManifest.content_hash,
      },
      {
        id: stableManifest.version,
        status: stableManifest.status,
        created_at: stableManifest.created_at,
        content_hash: stableManifest.content_hash,
      },
    ],
  }
  await env.CONTENT.put(INDEX_KEY, JSON.stringify(index))
}

/**
 * Capture every line written to `console.log` during `fn`. Returns the
 * captured strings so the caller can assert (or negate) specific
 * structured-log events — the handler emits an `icon_miss_fallback`
 * event that these tests pin on.
 *
 * `console.log` is restored in a `finally` so a thrown assertion
 * doesn't leak the stub into later tests.
 */
async function withConsoleLogCapture<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; captured: string[] }> {
  const captured: string[] = []
  const origLog = console.log
  console.log = (msg: unknown) => {
    captured.push(typeof msg === 'string' ? msg : String(msg))
  }
  try {
    const result = await fn()
    return { result, captured }
  } finally {
    console.log = origLog
  }
}

/** Filter captured log lines down to `icon_miss_fallback` events. */
function fallbackLogEntries(captured: string[]): Array<{
  event: string
  version: string
  element_id: string
  variant: string
}> {
  const out: Array<{
    event: string
    version: string
    element_id: string
    variant: string
  }> = []
  for (const line of captured) {
    try {
      const parsed = JSON.parse(line) as { event?: string }
      if (parsed.event === 'icon_miss_fallback') {
        out.push(
          parsed as {
            event: string
            version: string
            element_id: string
            variant: string
          },
        )
      }
    } catch {
      // non-JSON log lines — ignore.
    }
  }
  return out
}

describe('Icons: GET /api/v2/shapes/:shape.svg', () => {
  beforeEach(async () => {
    _resetInlineBundles()
    await seedIconBundles()
  })

  it('returns the hexagon SVG with immutable cache', async () => {
    const res = await SELF.fetch('https://example.com/api/v2/shapes/hexagon.svg')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/image\/svg\+xml/)
    expect(res.headers.get('Cache-Control')).toContain('immutable')
    const body = await res.text()
    // Sanity-check that the hexagon path data made it into the
    // response. The `d` below is lifted from shapes.ts to keep the
    // assertion specific without duplicating the full path.
    expect(body).toContain('M31.8564 8.8453L19 1.42265')
    expect(body).toContain('viewBox="0 0 36 36"')
  })

  it('returns all four shape primitives', async () => {
    for (const shape of ['hexagon', 'circle', 'octagon', 'rounded-square']) {
      const res = await SELF.fetch(`https://example.com/api/v2/shapes/${shape}.svg`)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toMatch(/image\/svg\+xml/)
    }
  })

  it('unknown shape returns 404 with valid-shapes list and no-store cache', async () => {
    const res = await SELF.fetch('https://example.com/api/v2/shapes/triangle.svg')
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const body = (await res.json()) as {
      ok: false
      errors: { code: string; message: string; fix_hint?: string }[]
    }
    expect(body.errors[0]?.code).toBe('not_found')
    expect(body.errors[0]?.fix_hint ?? '').toMatch(/hexagon/)
    expect(body.errors[0]?.fix_hint ?? '').toMatch(/circle/)
  })
})

describe('Icons: GET /api/v2/schemas/:version/symbols/:symbol_id.svg', () => {
  beforeEach(async () => {
    _resetInlineBundles()
    await seedIconBundles()
  })

  it('beta: returns the symbol with DTPR-Content-Hash and max-age=3600', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/symbols/dm_accept-or-deny.svg`,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/image\/svg\+xml/)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
    const manifest = makeManifest(SAMPLE_BETA_VERSION)
    expect(res.headers.get('DTPR-Content-Hash')).toBe(manifest.content_hash)
    const body = await res.text()
    expect(body).toBe(acceptDenySymbolRaw)
  })

  it('beta: URL-encoded @ in version resolves identically', async () => {
    const encoded = SAMPLE_BETA_VERSION.canonical.replace('@', '%40')
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${encoded}/symbols/dm_accept-or-deny.svg`,
    )
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toBe(acceptDenySymbolRaw)
  })

  it('stable: returns Cache-Control: public, max-age=31536000, immutable', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/symbols/dm_accept-or-deny.svg`,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    const manifest = makeManifest(SAMPLE_VERSION)
    expect(res.headers.get('DTPR-Content-Hash')).toBe(manifest.content_hash)
  })

  it('unknown symbol id returns 404 with no-store cache', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/symbols/does_not_exist.svg`,
    )
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const body = (await res.json()) as { ok: false; errors: { code: string }[] }
    expect(body.errors[0]?.code).toBe('not_found')
  })

  it('path-traversal attempt (%2F) is rejected by the id regex', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/symbols/..%2Findex.svg`,
    )
    expect(res.status).toBe(400)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const body = (await res.json()) as { ok: false; errors: { code: string }[] }
    expect(body.errors[0]?.code).toBe('bad_request')
  })

  it('unknown version returns 404 with no-store cache', async () => {
    const res = await SELF.fetch(
      'https://example.com/api/v2/schemas/ai@2099-12-31/symbols/dm_accept-or-deny.svg',
    )
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})

describe('Icons: GET /api/v2/schemas/:version/elements/:element_id/icon[.<variant>].svg', () => {
  // Pre-baked marker bodies the tests can look for. Using distinct
  // content per variant means a route that picks the wrong key fails
  // loudly in body-byte asserts rather than silently serving the
  // `default` bytes for every variant.
  const PREBAKED_DEFAULT = '<svg data-test="prebaked-default">default</svg>'
  const PREBAKED_DARK = '<svg data-test="prebaked-dark">dark</svg>'
  const PREBAKED_AI_ONLY = '<svg data-test="prebaked-ai-only">ai_only</svg>'

  beforeEach(async () => {
    _resetInlineBundles()
  })

  describe('pre-baked hot path', () => {
    beforeEach(async () => {
      await seedIconBundles({
        composedIcons: {
          'accept_deny/default': PREBAKED_DEFAULT,
          'accept_deny/dark': PREBAKED_DARK,
          'accept_deny/ai_only': PREBAKED_AI_ONLY,
        },
      })
    })

    it('default variant serves pre-baked bytes with beta max-age=3600 and no fallback log', async () => {
      const { result: res, captured } = await withConsoleLogCapture(async () =>
        SELF.fetch(
          `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.svg`,
        ),
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toMatch(/image\/svg\+xml/)
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
      const manifest = makeManifest(SAMPLE_BETA_VERSION)
      expect(res.headers.get('DTPR-Content-Hash')).toBe(manifest.content_hash)
      const body = await res.text()
      expect(body).toBe(PREBAKED_DEFAULT)
      expect(fallbackLogEntries(captured)).toEqual([])
    })

    it('dark variant serves the dark pre-baked bytes', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.dark.svg`,
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
      const body = await res.text()
      expect(body).toBe(PREBAKED_DARK)
    })

    it('context-colored variant serves the colored pre-baked bytes', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.ai_only.svg`,
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
      const body = await res.text()
      expect(body).toBe(PREBAKED_AI_ONLY)
    })

    it('stable release ignores pre-baked-vs-fallback and always returns immutable', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/accept_deny/icon.svg`,
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Cache-Control')).toBe(
        'public, max-age=31536000, immutable',
      )
      const manifest = makeManifest(SAMPLE_VERSION)
      expect(res.headers.get('DTPR-Content-Hash')).toBe(manifest.content_hash)
    })
  })

  describe('miss-fallback path', () => {
    beforeEach(async () => {
      // Intentionally no composedIcons entry — forces the on-the-fly
      // compositor to run.
      await seedIconBundles()
    })

    it('default variant composes on the fly and logs icon_miss_fallback', async () => {
      const { result: res, captured } = await withConsoleLogCapture(async () =>
        SELF.fetch(
          `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.svg`,
        ),
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toMatch(/image\/svg\+xml/)
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=60')
      const body = await res.text()
      const expected = composeIcon({
        shape: 'hexagon',
        symbolSvg: acceptDenySymbolRaw,
        variant: 'default',
      })
      expect(body).toBe(expected)

      const fallbacks = fallbackLogEntries(captured)
      expect(fallbacks).toHaveLength(1)
      expect(fallbacks[0]).toMatchObject({
        event: 'icon_miss_fallback',
        version: SAMPLE_BETA_VERSION.canonical,
        element_id: 'accept_deny',
        variant: 'default',
      })
    })

    it('dark variant composes on the fly', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.dark.svg`,
      )
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toBe(
        composeIcon({
          shape: 'hexagon',
          symbolSvg: acceptDenySymbolRaw,
          variant: 'dark',
        }),
      )
    })

    it('context variant composes with the context-value color', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.ai_only.svg`,
      )
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toBe(
        composeIcon({
          shape: 'hexagon',
          symbolSvg: acceptDenySymbolRaw,
          variant: { kind: 'colored', color: '#F28C28' },
        }),
      )
    })
  })

  describe('byte parity between pre-baked and miss-fallback', () => {
    it('pre-baked hit and on-the-fly fallback return byte-identical bodies for the same inputs', async () => {
      // Step 1: compute the byte-exact composed SVG the build step
      // would persist under `schemas/<ver>/icons/accept_deny/default.svg`,
      // seed it as the pre-baked entry, and fetch it.
      const composedBytes = composeIcon({
        shape: 'hexagon',
        symbolSvg: acceptDenySymbolRaw,
        variant: 'default',
      })
      await seedIconBundles({
        composedIcons: { 'accept_deny/default': composedBytes },
      })
      const prebakedRes = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.svg`,
      )
      expect(prebakedRes.status).toBe(200)
      const prebakedBody = await prebakedRes.text()

      // Step 2: re-seed WITHOUT the composed icon so the same URL
      // falls through to on-the-fly composition.
      _resetInlineBundles()
      await seedIconBundles()
      const fallbackRes = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.svg`,
      )
      expect(fallbackRes.status).toBe(200)
      const fallbackBody = await fallbackRes.text()

      // Both paths must agree on every byte. This is the guarantee
      // that pre-bake and runtime compositors stay in lockstep — any
      // drift between them would make the API serve different bytes
      // depending on R2 cache state.
      expect(prebakedBody).toBe(fallbackBody)
      expect(prebakedBody).toBe(composedBytes)
    })
  })

  describe('edge: category with no context', () => {
    const noContextCategories: Category[] = [
      {
        id: 'ai__decision',
        name: [loc('en', 'Decision')],
        description: [loc('en', 'How decisions get made.')],
        prompt: [],
        required: true,
        order: 1,
        datachain_type: 'ai',
        shape: 'hexagon',
        element_variables: [],
        // No context — any variant other than default / dark is 404.
      },
    ]

    beforeEach(async () => {
      await seedIconBundles({ categories: noContextCategories })
    })

    it('default variant composes successfully even without context', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.svg`,
      )
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toBe(
        composeIcon({
          shape: 'hexagon',
          symbolSvg: acceptDenySymbolRaw,
          variant: 'default',
        }),
      )
    })

    it('dark variant composes successfully even without context', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.dark.svg`,
      )
      expect(res.status).toBe(200)
    })

    it('arbitrary variant returns 404 listing only default and dark', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.ai_only.svg`,
      )
      expect(res.status).toBe(404)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      const body = (await res.json()) as {
        ok: false
        errors: { code: string; fix_hint?: string }[]
      }
      expect(body.errors[0]?.code).toBe('not_found')
      expect(body.errors[0]?.fix_hint ?? '').toMatch(/default/)
      expect(body.errors[0]?.fix_hint ?? '').toMatch(/dark/)
      expect(body.errors[0]?.fix_hint ?? '').not.toMatch(/ai_only/)
    })
  })

  describe('error paths', () => {
    beforeEach(async () => {
      await seedIconBundles()
    })

    it('unknown element returns 404 with no-store cache', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/does_not_exist/icon.svg`,
      )
      expect(res.status).toBe(404)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      const body = (await res.json()) as { ok: false; errors: { code: string }[] }
      expect(body.errors[0]?.code).toBe('not_found')
    })

    it('unknown variant for a context-carrying element lists valid variants', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.does_not_exist.svg`,
      )
      expect(res.status).toBe(404)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      const body = (await res.json()) as {
        ok: false
        errors: { code: string; fix_hint?: string }[]
      }
      expect(body.errors[0]?.code).toBe('not_found')
      const hint = body.errors[0]?.fix_hint ?? ''
      expect(hint).toMatch(/default/)
      expect(hint).toMatch(/dark/)
      expect(hint).toMatch(/ai_only/)
    })

    it('path-traversal attempt in element_id returns 400 with no-store', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/..%2Fevil/icon.svg`,
      )
      expect(res.status).toBe(400)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      const body = (await res.json()) as { ok: false; errors: { code: string }[] }
      expect(body.errors[0]?.code).toBe('bad_request')
    })

    it('element referencing a missing symbol returns 404', async () => {
      // Override symbols map so `dm_accept-or-deny` isn't present.
      await seedIconBundles({ symbols: {} })
      const res = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.svg`,
      )
      expect(res.status).toBe(404)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      const body = (await res.json()) as { ok: false; errors: { code: string }[] }
      expect(body.errors[0]?.code).toBe('not_found')
    })

    it('unknown version returns 404 with no-store', async () => {
      const res = await SELF.fetch(
        'https://example.com/api/v2/schemas/ai@2099-12-31/elements/accept_deny/icon.svg',
      )
      expect(res.status).toBe(404)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
    })
  })

  describe('response headers', () => {
    beforeEach(async () => {
      await seedIconBundles({
        composedIcons: { 'accept_deny/default': PREBAKED_DEFAULT },
      })
    })

    it('every successful composed response carries DTPR-Content-Hash', async () => {
      const manifest = makeManifest(SAMPLE_BETA_VERSION)
      // Pre-baked hit.
      const hit = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.svg`,
      )
      expect(hit.headers.get('DTPR-Content-Hash')).toBe(manifest.content_hash)
      // Miss-fallback on a different variant (not in composedIcons).
      const miss = await SELF.fetch(
        `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/elements/accept_deny/icon.dark.svg`,
      )
      expect(miss.status).toBe(200)
      expect(miss.headers.get('DTPR-Content-Hash')).toBe(manifest.content_hash)
    })
  })
})
