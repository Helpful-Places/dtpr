import { describe, it, expect } from 'vitest'
import {
  ElementSchema,
  CategorySchema,
  DatachainTypeSchema,
  DatachainInstanceSchema,
  ProvenanceRefSchema,
  SchemaManifestSchema,
} from '@dtpr/api/schema'
import { validateInstance } from '@dtpr/api/validator'

const validElement = {
  id: 'test-element',
  category_id: 'cat-1',
  title: [{ locale: 'en', value: 'Test Element' }],
  description: [{ locale: 'en', value: 'Description' }],
  symbol_id: 'signal',
  variables: [],
}

describe('@dtpr/api/schema subpath export', () => {
  it('parses a valid element via ElementSchema.parse', () => {
    const parsed = ElementSchema.parse(validElement)
    expect(parsed.id).toBe('test-element')
    expect(parsed.title[0]?.value).toBe('Test Element')
  })

  it('exposes CategorySchema and SchemaManifestSchema', () => {
    expect(CategorySchema).toBeDefined()
    expect(SchemaManifestSchema).toBeDefined()
  })

  it('rejects invalid element with ZodError-compatible shape', () => {
    const bad = { ...validElement, id: 'not valid!' } // id regex failure
    const result = ElementSchema.safeParse(bad)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('@dtpr/api/validator subpath export', () => {
  it('exposes validateInstance', () => {
    expect(typeof validateInstance).toBe('function')
  })
})

describe('ProvenanceRefSchema', () => {
  it('parses a minimal reference (type + title)', () => {
    const parsed = ProvenanceRefSchema.parse({
      type: 'framework',
      title: 'NIST AI Risk Management Framework 1.0',
    })
    expect(parsed.type).toBe('framework')
    expect(parsed.url).toBeUndefined()
  })

  it('accepts schema-design provenance types beyond the original instance set', () => {
    for (const type of [
      'framework',
      'standard',
      'regulation',
      'research_paper',
      'prior_art',
      'internal_memo',
    ] as const) {
      const r = ProvenanceRefSchema.safeParse({ type, title: 't' })
      expect(r.success).toBe(true)
    }
  })

  it('rejects an unknown type', () => {
    const r = ProvenanceRefSchema.safeParse({ type: 'pizza', title: 't' })
    expect(r.success).toBe(false)
  })
})

describe('schema-definition sources[]', () => {
  it('accepts sources on DatachainType', () => {
    const r = DatachainTypeSchema.safeParse({
      id: 'ai',
      name: [{ locale: 'en', value: 'AI' }],
      description: [],
      categories: ['c'],
      locales: ['en'],
      sources: [{ type: 'framework', title: 'NIST AI RMF' }],
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.sources).toHaveLength(1)
  })

  it('accepts sources on Category and defaults to []', () => {
    const r = CategorySchema.safeParse({
      id: 'accountable',
      name: [{ locale: 'en', value: 'Accountable' }],
      description: [{ locale: 'en', value: 'Who is accountable.' }],
      datachain_type: 'ai',
      shape: 'hexagon',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.sources).toEqual([])
      expect(r.data.authoring_guidance).toEqual([])
      expect(r.data.examples).toEqual([])
    }
  })

  it('accepts sources, authoring_guidance, and examples on Element', () => {
    const r = ElementSchema.safeParse({
      id: 'test',
      category_id: 'c',
      title: [{ locale: 'en', value: 'T' }],
      description: [{ locale: 'en', value: 'D' }],
      symbol_id: 's',
      authoring_guidance: [{ locale: 'en', value: 'Use this when…' }],
      examples: [
        {
          scenario: [{ locale: 'en', value: 'Worcester LPR' }],
          narrative: [{ locale: 'en', value: 'A camera reads plates…' }],
        },
      ],
      sources: [{ type: 'model_card', title: 'Vendor card', url: 'https://example.com/card' }],
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.examples[0]?.scenario[0]?.value).toBe('Worcester LPR')
      expect(r.data.sources[0]?.url).toBe('https://example.com/card')
    }
  })
})

describe('per-element sources on DatachainInstance', () => {
  it('accepts sources on instance elements', () => {
    const r = DatachainInstanceSchema.safeParse({
      id: 'worcester-lpr',
      schema_version: 'ai@2026-05-06-beta',
      created_at: '2026-05-06T00:00:00.000Z',
      elements: [
        {
          element_id: 'accept_deny',
          sources: [{ type: 'policy_document', title: 'City policy' }],
        },
      ],
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.elements[0]?.sources).toHaveLength(1)
    }
  })
})
