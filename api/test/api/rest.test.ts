import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { env, SELF } from 'cloudflare:test'
import {
  SAMPLE_BETA_VERSION,
  SAMPLE_VERSION,
  clearBucket,
  makeElements,
  makeManifest,
  seedVersion,
} from './seed.ts'
import { INDEX_KEY } from '../../src/store/keys.ts'
import { _resetInlineBundles } from '../../src/store/inline-bundles.ts'

beforeEach(() => {
  _resetInlineBundles()
})

describe('REST: GET /api/v2/schemas', () => {
  beforeAll(async () => {
    await seedVersion()
  })

  it('returns the registered versions', async () => {
    const res = await SELF.fetch('https://example.com/api/v2/schemas')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: true; versions: Array<{ id: string; status: string }> }
    expect(body.ok).toBe(true)
    expect(body.versions[0]?.id).toBe(SAMPLE_VERSION.canonical)
    expect(body.versions[0]?.status).toBe('stable')
  })

  it('returns an empty list when index is absent', async () => {
    await clearBucket()
    const res = await SELF.fetch('https://example.com/api/v2/schemas')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: true; versions: unknown[] }
    expect(body.versions).toEqual([])
  })
})

describe('REST: version normalization + 404 paths', () => {
  beforeAll(async () => {
    await seedVersion()
  })

  it('@-form returns the manifest', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/manifest`,
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { manifest: { version: string } }
    expect(body.manifest.version).toBe(SAMPLE_VERSION.canonical)
  })

  it('%40-encoded version is treated identically to @ form', async () => {
    const encoded = SAMPLE_VERSION.canonical.replace('@', '%40')
    const res = await SELF.fetch(`https://example.com/api/v2/schemas/${encoded}/manifest`)
    expect(res.status).toBe(200)
  })

  it('unknown version returns 404 envelope with fix_hint', async () => {
    const res = await SELF.fetch('https://example.com/api/v2/schemas/ai@2099-12-31/manifest')
    expect(res.status).toBe(404)
    const body = (await res.json()) as { ok: false; errors: { code: string; fix_hint?: string }[] }
    expect(body.ok).toBe(false)
    expect(body.errors[0]?.code).toBe('not_found')
    expect(body.errors[0]?.fix_hint).toContain('GET /api/v2/schemas')
  })

  it('malformed version returns 400', async () => {
    const res = await SELF.fetch('https://example.com/api/v2/schemas/ai@2026-04/manifest')
    expect(res.status).toBe(400)
  })

  it('missing route returns 404 envelope', async () => {
    const res = await SELF.fetch('https://example.com/api/v2/nope')
    expect(res.status).toBe(404)
    const body = (await res.json()) as { ok: false; errors: { code: string }[] }
    expect(body.errors[0]?.code).toBe('not_found')
  })
})

describe('REST: GET .../categories', () => {
  beforeAll(async () => {
    await seedVersion()
  })

  it('returns categories with all locales', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/categories`,
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      categories: Array<{ name: { locale: string }[] }>
    }
    const locales = body.categories[0]?.name.map((n) => n.locale).sort()
    expect(locales).toEqual(['en', 'fr'])
  })

  it('?locales=en filters to a single locale', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/categories?locales=en`,
    )
    const body = (await res.json()) as {
      categories: Array<{ name: { locale: string }[] }>
    }
    expect(body.categories[0]?.name.map((n) => n.locale)).toEqual(['en'])
  })

  it('stamps DTPR-Content-Hash and immutable Cache-Control on stable', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/categories`,
    )
    expect(res.headers.get('DTPR-Content-Hash')).toMatch(/^sha256-[0-9a-f]{64}$/)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable')
  })
})

describe('REST: GET .../elements', () => {
  beforeAll(async () => {
    await seedVersion()
  })

  it('default projection returns id, title, category_ids only', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements`,
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      elements: Array<Record<string, unknown>>
      meta: { total: number; returned: number }
    }
    expect(body.meta.total).toBe(3)
    expect(body.meta.returned).toBe(3)
    const fields = Object.keys(body.elements[0] ?? {}).sort()
    expect(fields).toEqual(['category_ids', 'id', 'title'])
  })

  it('?fields=id,description returns only those fields (id always included)', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?fields=description`,
    )
    const body = (await res.json()) as { elements: Array<Record<string, unknown>> }
    const fields = Object.keys(body.elements[0] ?? {}).sort()
    expect(fields).toEqual(['description', 'id'])
  })

  it('?fields=all returns full elements', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?fields=all`,
    )
    const body = (await res.json()) as { elements: Array<Record<string, unknown>> }
    expect(Object.keys(body.elements[0] ?? {})).toEqual(
      expect.arrayContaining(['id', 'title', 'description', 'icon', 'category_ids', 'variables']),
    )
  })

  it('?category_id filters elements', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?category_id=ai__decision`,
    )
    const body = (await res.json()) as { meta: { total: number } }
    expect(body.meta.total).toBe(3)
  })

  it('?category_id=missing returns empty array (not 404)', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?category_id=ai__nope`,
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { elements: unknown[]; meta: { total: number } }
    expect(body.meta.total).toBe(0)
    expect(body.elements).toEqual([])
  })

  it('?limit=1 paginates with a next_cursor', async () => {
    const res1 = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?limit=1`,
    )
    const body1 = (await res1.json()) as {
      meta: { next_cursor: string | null; returned: number }
    }
    expect(body1.meta.returned).toBe(1)
    expect(body1.meta.next_cursor).toBeTruthy()

    const res2 = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?limit=1&cursor=${encodeURIComponent(body1.meta.next_cursor!)}`,
    )
    const body2 = (await res2.json()) as {
      meta: { next_cursor: string | null; returned: number }
    }
    expect(body2.meta.returned).toBe(1)
  })

  it('?limit beyond max → 400', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?limit=999`,
    )
    expect(res.status).toBe(400)
  })

  it('malformed cursor → 400', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?cursor=junk`,
    )
    expect(res.status).toBe(400)
  })

  it('?query=video matches identifiable_video first', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?query=video&fields=id`,
    )
    const body = (await res.json()) as { elements: Array<{ id: string }> }
    expect(body.elements[0]?.id).toBe('identifiable_video')
  })
})

describe('REST: GET .../elements/:id', () => {
  beforeAll(async () => {
    await seedVersion()
  })

  it('returns the full element by default', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/accept_deny`,
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { element: { id: string; description: { locale: string }[] } }
    expect(body.element.id).toBe('accept_deny')
    expect(body.element.description.length).toBeGreaterThan(0)
  })

  it('unknown id returns 404 with fix_hint pointing to /elements', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/nonexistent`,
    )
    expect(res.status).toBe(404)
    const body = (await res.json()) as { ok: false; errors: { fix_hint?: string }[] }
    expect(body.errors[0]?.fix_hint).toContain('/elements')
  })

  it('?locales=fr filters', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/accept_deny?locales=fr`,
    )
    const body = (await res.json()) as { element: { title: { locale: string }[] } }
    expect(body.element.title.map((t) => t.locale)).toEqual(['fr'])
  })
})

describe('REST: POST .../validate', () => {
  beforeAll(async () => {
    await seedVersion()
  })

  it('valid datachain returns ok:true', async () => {
    const body = {
      id: 'test-1',
      schema_version: SAMPLE_VERSION.canonical,
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny' }],
    }
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/validate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as { ok: boolean }
    expect(json.ok).toBe(true)
  })

  it('invalid datachain returns ok:false with errors', async () => {
    const body = {
      id: 'test-2',
      schema_version: SAMPLE_VERSION.canonical,
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'nonexistent' }],
    }
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/validate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      ok: false
      errors: { code: string; fix_hint?: string }[]
    }
    expect(json.ok).toBe(false)
    expect(json.errors.length).toBeGreaterThan(0)
  })

  it('malformed JSON body returns 400', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/validate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not json',
      },
    )
    expect(res.status).toBe(400)
  })

  it('non-instance body shape returns ok:false with parse_error codes', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/validate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wrong: 'shape' }),
      },
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as { ok: false; errors: { code: string }[] }
    expect(json.ok).toBe(false)
    expect(json.errors.every((e) => e.code === 'parse_error')).toBe(true)
  })
})

describe('REST: cache control on beta', () => {
  beforeAll(async () => {
    await seedVersion({ version: SAMPLE_BETA_VERSION, manifest: makeManifest(SAMPLE_BETA_VERSION) })
  })

  it('beta returns Cache-Control: no-store', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_BETA_VERSION.canonical}/categories`,
    )
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
