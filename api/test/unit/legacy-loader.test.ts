import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import {
  LEGACY_VERSIONS,
  R2LoadError,
  legacyDocumentKey,
  legacyIconKey,
  loadLegacyDocument,
  loadLegacyIconSvg,
  type LegacyVersion,
} from '../../src/store/index.ts'
import {
  LEGACY_DOCUMENT_IDS,
  legacyDocument,
  legacyIcon,
  legacyIconIds,
  legacyManifest,
  legacyRawDocument,
  legacyVariant,
} from '../api/legacy-fixtures.ts'
import { countingBucket } from '../api/legacy-test-helpers.ts'
import { clearBucket } from '../api/seed.ts'

/**
 * Everything imported above comes from the store barrel, not from
 * `r2-loader.ts` — the legacy routes are held to the same rule as the
 * v2 ones, and this import is what proves the barrel actually
 * re-exports them.
 *
 * `caches.default` under vitest-pool-workers is a real, shared
 * Miniflare cache that outlives each test (see `cache-wrapper.test.ts`
 * for the same note). Legacy cache keys carry no version segment to
 * make them unique, so every case below seeds a *different* document
 * id or icon id. Reusing one id would let an earlier test's cached
 * bytes answer a later test's miss.
 */

/** A bucket whose reads fail for a reason that is not a miss. */
function failingBucket(message: string): R2Bucket {
  return {
    get: () => Promise.reject(new Error(message)),
  } as unknown as R2Bucket
}

const utf8ByteLength = (s: string) => new TextEncoder().encode(s).byteLength

beforeEach(clearBucket)

describe('keys: legacyDocumentKey / legacyIconKey', () => {
  it('builds version-free document keys under the legacy prefix', () => {
    expect(legacyDocumentKey('v0', 'en')).toBe('legacy/documents/v0/en.json')
    expect(legacyDocumentKey('v1', 'elements')).toBe('legacy/documents/v1/elements.json')
    expect(legacyDocumentKey('v1', 'elements/ai')).toBe('legacy/documents/v1/elements/ai.json')
    expect(legacyDocumentKey('v1', 'categories/device')).toBe(
      'legacy/documents/v1/categories/device.json',
    )
  })

  it('gives each major its own icon namespace, so a shared id is two keys', () => {
    expect(legacyIconKey('v0', 'available_for_resale')).toBe(
      'legacy/icons/v0/available_for_resale.svg',
    )
    expect(legacyIconKey('v1', 'available_for_resale')).toBe(
      'legacy/icons/v1/available_for_resale.svg',
    )
    expect(legacyIconKey('v0', 'x')).not.toBe(legacyIconKey('v1', 'x'))
  })

  it('every key builder covers the declared majors', () => {
    expect([...LEGACY_VERSIONS]).toEqual(['v0', 'v1'])
    for (const v of LEGACY_VERSIONS) {
      expect(legacyDocumentKey(v, 'x')).toContain(`/${v}/`)
      expect(legacyIconKey(v, 'x')).toContain(`/${v}/`)
    }
  })

  it('every document id in the manifest maps onto a key', () => {
    for (const id of LEGACY_DOCUMENT_IDS) {
      const slash = id.indexOf('/')
      const version = id.slice(0, slash) as LegacyVersion
      const path = id.slice(slash + 1)
      expect(legacyDocumentKey(version, path)).toBe(`legacy/documents/${id}.json`)
    }
  })
})

describe('r2-loader: loadLegacyDocument', () => {
  it('returns the stored bytes verbatim, not a re-serialisation', async () => {
    // Whitespace and key order that `JSON.parse`+`stringify` would not
    // preserve: if the loader ever starts parsing, this fails.
    const stored = '[ {"b": 2,\n  "a": 1} ]'
    await env.CONTENT.put(legacyDocumentKey('v0', 'en'), stored)
    const r = await loadLegacyDocument({ bucket: env.CONTENT }, 'v0', 'en')
    expect(r).toBe(stored)
  })

  it('returns null for a missing key rather than throwing', async () => {
    const r = await loadLegacyDocument({ bucket: env.CONTENT }, 'v0', 'zz')
    expect(r).toBeNull()
  })

  it('surfaces a non-miss R2 failure as R2LoadError (mapped to 502 upstream)', async () => {
    const bucket = failingBucket('connection reset')
    await expect(loadLegacyDocument({ bucket }, 'v0', 'fr')).rejects.toBeInstanceOf(R2LoadError)
    await expect(loadLegacyDocument({ bucket }, 'v0', 'fr')).rejects.toThrow(
      /legacy\/documents\/v0\/fr\.json/,
    )
  })

  it('serves the second read of the same key from cache', async () => {
    await env.CONTENT.put(legacyDocumentKey('v0', 'es'), '["es"]')
    const { bucket, reads } = countingBucket(env.CONTENT)
    expect(await loadLegacyDocument({ bucket }, 'v0', 'es')).toBe('["es"]')
    expect(reads()).toBe(1)
    expect(await loadLegacyDocument({ bucket }, 'v0', 'es')).toBe('["es"]')
    expect(reads()).toBe(1)
  })

  it('does not cache a miss, so a later upload becomes visible', async () => {
    const { bucket, reads } = countingBucket(env.CONTENT)
    expect(await loadLegacyDocument({ bucket }, 'v1', 'categories/nope')).toBeNull()
    await env.CONTENT.put(legacyDocumentKey('v1', 'categories/nope'), '[]')
    expect(await loadLegacyDocument({ bucket }, 'v1', 'categories/nope')).toBe('[]')
    expect(reads()).toBe(2)
  })
})

describe('r2-loader: loadLegacyIconSvg', () => {
  it('returns the stored SVG text', async () => {
    const svg = '<svg width="36" height="36"><path d="M0 0"/></svg>\n'
    await env.CONTENT.put(legacyIconKey('v1', 'accessibility'), svg)
    const r = await loadLegacyIconSvg({ bucket: env.CONTENT }, 'v1', 'accessibility')
    expect(r).toBe(svg)
  })

  it('returns null for an id absent from that major, without consulting the other', async () => {
    // The namespaces are independent by design: a v1-only id is a
    // genuine 404 under v0, never a cross-version fallback.
    await env.CONTENT.put(legacyIconKey('v1', 'ai_only_icon'), '<svg/>')
    expect(await loadLegacyIconSvg({ bucket: env.CONTENT }, 'v0', 'ai_only_icon')).toBeNull()
    expect(await loadLegacyIconSvg({ bucket: env.CONTENT }, 'v1', 'ai_only_icon')).toBe('<svg/>')
  })

  it('surfaces a non-miss R2 failure as R2LoadError', async () => {
    await expect(
      loadLegacyIconSvg({ bucket: failingBucket('io error') }, 'v1', 'aggregated'),
    ).rejects.toBeInstanceOf(R2LoadError)
  })

  it('serves the second read of the same key from cache', async () => {
    await env.CONTENT.put(legacyIconKey('v0', 'aggregated'), '<svg id="agg"/>')
    const { bucket, reads } = countingBucket(env.CONTENT)
    expect(await loadLegacyIconSvg({ bucket }, 'v0', 'aggregated')).toBe('<svg id="agg"/>')
    expect(await loadLegacyIconSvg({ bucket }, 'v0', 'aggregated')).toBe('<svg id="agg"/>')
    expect(reads()).toBe(1)
  })
})

describe('legacy fixtures round-trip through R2 unchanged', () => {
  it('a captured document survives put + text load byte-for-byte', async () => {
    const source = legacyDocument('v0/pt')
    await env.CONTENT.put(legacyDocumentKey('v0', 'pt'), source)
    const loaded = await loadLegacyDocument({ bucket: env.CONTENT }, 'v0', 'pt')
    expect(loaded).toBe(source)
    // `getText` decodes as UTF-8, so string equality only implies byte
    // equality when the capture is valid UTF-8 — assert that directly
    // rather than assuming it. These documents carry Khmer, Tagalog and
    // accented Latin text, so it is not a formality.
    expect(utf8ByteLength(loaded ?? '')).toBe(utf8ByteLength(source))
  })

  it('a captured v1 document with non-Latin locales survives unchanged', async () => {
    const source = legacyDocument('v1/elements/ai')
    expect(source).toContain('ភ') // Khmer, from the alt_text locales
    await env.CONTENT.put(legacyDocumentKey('v1', 'elements/ai'), source)
    const loaded = await loadLegacyDocument({ bucket: env.CONTENT }, 'v1', 'elements/ai')
    expect(loaded).toBe(source)
    expect(utf8ByteLength(loaded ?? '')).toBe(utf8ByteLength(source))
  })

  it('a captured icon survives put + text load byte-for-byte, trailing newline included', async () => {
    const source = legacyIcon('accessibility')
    expect(source.endsWith('\n')).toBe(true)
    await env.CONTENT.put(legacyIconKey('v1', 'accessibility_roundtrip'), source)
    const loaded = await loadLegacyIconSvg(
      { bucket: env.CONTENT },
      'v1',
      'accessibility_roundtrip',
    )
    expect(loaded).toBe(source)
    expect(utf8ByteLength(loaded ?? '')).toBe(utf8ByteLength(source))
  })
})

describe('legacy fixture helper', () => {
  it('reads a captured document and a captured icon with no filesystem', () => {
    // workerd has no `node:fs`; these are inlined at bundle time.
    const doc = legacyDocument('v0/en')
    expect(JSON.parse(doc)).toBeInstanceOf(Array)
    expect(doc).toContain('/api/v0/icons/')
    const icon = legacyIcon('accessibility')
    expect(icon.startsWith('<svg')).toBe(true)
  })

  it('exposes every document the manifest records, published and raw', () => {
    expect(LEGACY_DOCUMENT_IDS).toHaveLength(11)
    for (const id of LEGACY_DOCUMENT_IDS) {
      expect(legacyDocument(id).length).toBeGreaterThan(0)
      expect(legacyRawDocument(id).length).toBeGreaterThan(0)
    }
  })

  it('keeps the published and raw captures distinct — the rewrite is visible', () => {
    expect(legacyRawDocument('v0/en')).not.toBe(legacyDocument('v0/en'))
    expect(legacyRawDocument('v0/en')).not.toContain('/api/v0/icons/')
  })

  it('exposes the per-major icon fan-out lists from the manifest', () => {
    expect(legacyIconIds('v0')).toHaveLength(123)
    expect(legacyIconIds('v1')).toHaveLength(148)
    // 148 files on disk, 271 R2 objects once fanned out.
    expect(Object.keys(legacyManifest.icons.hashes)).toHaveLength(148)
    // `toContain` rather than `startsWith`: nine of the captured icons
    // open with an XML prolog before the `<svg>` element.
    for (const id of legacyIconIds('v0')) {
      expect(legacyIcon(id)).toContain('<svg')
    }
    for (const id of legacyIconIds('v1')) {
      expect(legacyIcon(id)).toContain('<svg')
    }
  })

  it('exposes the captured locale-filter variants', () => {
    expect(legacyVariant('v1_elements_ai__en').length).toBeGreaterThan(0)
    expect(legacyVariant('v1_categories_device__commas').length).toBeGreaterThan(0)
  })

  it('names the missing id when a fixture lookup fails', () => {
    expect(() => legacyDocument('v0/nope')).toThrow(/No legacy document fixture for "v0\/nope"/)
  })
})
