import { describe, it, expect, beforeEach } from 'vitest'
import { env, SELF } from 'cloudflare:test'
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

/**
 * Register inline bundles for both the beta and stable sample
 * versions, and write a schemas/index.json that lists both so
 * `resolveKnownVersion` accepts them. Inline bundles short-circuit
 * the R2 loaders for symbols, so we don't need to seed SVG blobs in
 * R2 itself — mirroring what `schema:build` will emit once the
 * inline-bundle pipeline is wired.
 */
async function seedIconBundles(): Promise<void> {
  await clearBucket()
  const betaManifest = makeManifest(SAMPLE_BETA_VERSION)
  const stableManifest = makeManifest(SAMPLE_VERSION)

  registerInlineBundle(SAMPLE_BETA_VERSION.canonical, {
    manifest: betaManifest,
    datachainType: makeDatachainType(),
    categories: makeIconCategories(),
    elements: makeIconElements(),
    schemaJson: {},
    searchIndexesByLocale: {},
    symbols: { 'dm_accept-or-deny': acceptDenySymbolRaw },
    composedIcons: {},
  })

  registerInlineBundle(SAMPLE_VERSION.canonical, {
    manifest: stableManifest,
    datachainType: makeDatachainType(),
    categories: makeIconCategories(),
    elements: makeIconElements(),
    schemaJson: {},
    searchIndexesByLocale: {},
    symbols: { 'dm_accept-or-deny': acceptDenySymbolRaw },
    composedIcons: {},
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
