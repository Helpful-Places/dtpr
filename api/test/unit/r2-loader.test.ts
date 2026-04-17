import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { env } from 'cloudflare:test'
import { parseVersion } from '../../cli/lib/version-parser.ts'
import {
  loadCategories,
  loadDatachainType,
  loadElement,
  loadElements,
  loadManifest,
  loadSchemaJson,
  loadSearchIndex,
  loadSchemaIndex,
  registerInlineBundle,
  _resetInlineBundles,
  type SchemaIndex,
} from '../../src/store/index.ts'
import {
  categoriesKey,
  datachainTypeKey,
  elementKey,
  elementsKey,
  manifestKey,
  schemaJsonKey,
  searchIndexKey,
  INDEX_KEY,
} from '../../src/store/keys.ts'

const STABLE_VERSION = parseVersion('ai@2026-04-16')
const BETA_VERSION = parseVersion('ai@2026-04-16-beta')

const sampleManifest = {
  version: STABLE_VERSION.canonical,
  status: 'stable',
  created_at: '2026-04-16T00:00:00.000Z',
  notes: '',
  content_hash: `sha256-${'a'.repeat(64)}`,
  locales: ['en'],
}

const betaManifest = { ...sampleManifest, version: BETA_VERSION.canonical, status: 'beta' }

const sampleCategory = {
  id: 'ai__decision',
  name: [{ locale: 'en', value: 'Decision' }],
  description: [{ locale: 'en', value: 'How decisions are made.' }],
  prompt: [],
  required: true,
  order: 1,
  datachain_type: 'ai',
  element_variables: [],
}

const sampleElement = {
  id: 'accept_deny',
  category_ids: ['ai__decision'],
  title: [{ locale: 'en', value: 'Accept / Deny' }],
  description: [{ locale: 'en', value: 'Binary outcome.' }],
  citation: [],
  icon: { url: '/i/accept_deny.svg', format: 'svg', alt_text: [{ locale: 'en', value: 'icon' }] },
  variables: [],
}

async function clearBucket(bucket: R2Bucket): Promise<void> {
  // Delete in batches to keep one helper covering both per-test cleanup
  // and the rare case where a bucket starts non-empty.
  let cursor: string | undefined
  do {
    const list = await bucket.list({ cursor, limit: 1000 })
    if (list.objects.length > 0) {
      await bucket.delete(list.objects.map((o) => o.key))
    }
    cursor = list.truncated ? list.cursor : undefined
  } while (cursor)
}

async function putJson(bucket: R2Bucket, key: string, value: unknown): Promise<void> {
  await bucket.put(key, JSON.stringify(value))
}

beforeEach(async () => {
  await clearBucket(env.CONTENT)
  _resetInlineBundles()
})

afterEach(async () => {
  _resetInlineBundles()
})

describe('r2-loader: loadManifest', () => {
  it('returns null when manifest is absent', async () => {
    const r = await loadManifest({ bucket: env.CONTENT }, STABLE_VERSION)
    expect(r).toBeNull()
  })

  it('returns the parsed manifest when present', async () => {
    await putJson(env.CONTENT, manifestKey(STABLE_VERSION), sampleManifest)
    const r = await loadManifest({ bucket: env.CONTENT }, STABLE_VERSION)
    expect(r).toEqual(sampleManifest)
  })

  it('cache hit on second call for stable versions (R2 reads exactly once)', async () => {
    const key = manifestKey(STABLE_VERSION)
    await putJson(env.CONTENT, key, sampleManifest)
    await loadManifest({ bucket: env.CONTENT }, STABLE_VERSION)
    // Mutate the underlying bytes; the cached call must still return the original.
    await putJson(env.CONTENT, key, { ...sampleManifest, notes: 'mutated' })
    const r2 = await loadManifest({ bucket: env.CONTENT }, STABLE_VERSION)
    expect(r2).toEqual(sampleManifest)
  })

  it('beta versions are not cached so freshly-uploaded bytes are visible immediately', async () => {
    const key = manifestKey(BETA_VERSION)
    await putJson(env.CONTENT, key, betaManifest)
    const a = await loadManifest({ bucket: env.CONTENT }, BETA_VERSION)
    expect(a?.notes).toBe('')
    await putJson(env.CONTENT, key, { ...betaManifest, notes: 'edit' })
    const b = await loadManifest({ bucket: env.CONTENT }, BETA_VERSION)
    expect(b?.notes).toBe('edit')
  })
})

describe('r2-loader: per-entity loaders', () => {
  it('loadCategories returns the array', async () => {
    await putJson(env.CONTENT, categoriesKey(STABLE_VERSION), [sampleCategory])
    const r = await loadCategories({ bucket: env.CONTENT }, STABLE_VERSION)
    expect(r).toEqual([sampleCategory])
  })

  it('loadElements returns the array', async () => {
    await putJson(env.CONTENT, elementsKey(STABLE_VERSION), [sampleElement])
    const r = await loadElements({ bucket: env.CONTENT }, STABLE_VERSION)
    expect(r).toEqual([sampleElement])
  })

  it('loadElement returns a single element by id', async () => {
    await putJson(env.CONTENT, elementKey(STABLE_VERSION, 'accept_deny'), sampleElement)
    const r = await loadElement({ bucket: env.CONTENT }, STABLE_VERSION, 'accept_deny')
    expect(r?.id).toBe('accept_deny')
  })

  it('loadElement returns null for an unknown id', async () => {
    const r = await loadElement({ bucket: env.CONTENT }, STABLE_VERSION, 'nope')
    expect(r).toBeNull()
  })

  it('loadDatachainType, loadSchemaJson round-trip', async () => {
    await putJson(env.CONTENT, datachainTypeKey(STABLE_VERSION), {
      id: 'ai',
      name: [{ locale: 'en', value: 'AI' }],
      description: [{ locale: 'en', value: 'AI datachain' }],
      categories: ['ai__decision'],
      locales: ['en'],
    })
    await putJson(env.CONTENT, schemaJsonKey(STABLE_VERSION), { Element: { type: 'object' } })

    const dct = await loadDatachainType({ bucket: env.CONTENT }, STABLE_VERSION)
    expect(dct?.id).toBe('ai')
    const sj = await loadSchemaJson({ bucket: env.CONTENT }, STABLE_VERSION)
    expect(sj?.Element).toEqual({ type: 'object' })
  })

  it('loadSearchIndex returns the raw serialized index', async () => {
    const serialized = '{"index":{"_documentCount":1}}'
    await env.CONTENT.put(searchIndexKey(STABLE_VERSION, 'en'), serialized)
    const r = await loadSearchIndex({ bucket: env.CONTENT }, STABLE_VERSION, 'en')
    expect(r).toBe(serialized)
  })
})

describe('r2-loader: loadSchemaIndex', () => {
  it('returns empty versions when index is absent', async () => {
    const r = await loadSchemaIndex({ bucket: env.CONTENT })
    expect(r).toEqual({ versions: [] })
  })

  it('returns parsed index when present', async () => {
    const index: SchemaIndex = {
      versions: [
        {
          id: 'ai@2026-04-16',
          status: 'stable',
          created_at: '2026-04-16T00:00:00.000Z',
          content_hash: `sha256-${'b'.repeat(64)}`,
        },
      ],
    }
    await putJson(env.CONTENT, INDEX_KEY, index)
    const r = await loadSchemaIndex({ bucket: env.CONTENT })
    expect(r).toEqual(index)
  })
})

describe('inline-bundle fallback', () => {
  it('short-circuits R2 reads when an inline bundle is registered for the version', async () => {
    registerInlineBundle(STABLE_VERSION.canonical, {
      manifest: sampleManifest as never,
      datachainType: { id: 'ai' } as never,
      categories: [sampleCategory] as never,
      elements: [sampleElement] as never,
      schemaJson: { Inline: true },
      searchIndexesByLocale: { en: '{"inline":1}' },
    })
    // Note: bucket is empty. If routing is correct, every loader returns
    // inline data without a single R2 call.
    expect(await loadManifest({ bucket: env.CONTENT }, STABLE_VERSION)).toEqual(sampleManifest)
    expect(await loadCategories({ bucket: env.CONTENT }, STABLE_VERSION)).toEqual([sampleCategory])
    expect(await loadElements({ bucket: env.CONTENT }, STABLE_VERSION)).toEqual([sampleElement])
    const el = await loadElement({ bucket: env.CONTENT }, STABLE_VERSION, 'accept_deny')
    expect(el?.id).toBe('accept_deny')
    const missing = await loadElement({ bucket: env.CONTENT }, STABLE_VERSION, 'nope')
    expect(missing).toBeNull()
    const search = await loadSearchIndex({ bucket: env.CONTENT }, STABLE_VERSION, 'en')
    expect(search).toBe('{"inline":1}')
  })
})
