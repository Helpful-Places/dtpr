import { describe, it, expect } from 'vitest'
import {
  CategorySchema,
  DatachainInstanceSchema,
  DatachainTypeSchema,
  ElementSchema,
  LocaleValueSchema,
  SchemaManifestSchema,
} from '../../src/schema/index.ts'

const loc = (locale: string, value: string) => ({ locale, value })

describe('LocaleValueSchema', () => {
  it('accepts a supported locale code', () => {
    expect(LocaleValueSchema.parse({ locale: 'en', value: 'hi' })).toEqual({
      locale: 'en',
      value: 'hi',
    })
  })

  it('rejects unknown locale code', () => {
    const result = LocaleValueSchema.safeParse({ locale: 'xx', value: 'hi' })
    expect(result.success).toBe(false)
  })
})

describe('ElementSchema', () => {
  const base = {
    id: 'accept_deny',
    category_id: 'ai__decision',
    title: [loc('en', 'Accept or deny')],
    description: [loc('en', 'Binary yes/no decision.')],
    symbol_id: 'signal',
  }

  it('parses a minimal element with defaults', () => {
    const el = ElementSchema.parse(base)
    expect(el.citation).toEqual([])
    expect(el.variables).toEqual([])
    expect(el.symbol_id).toBe('signal')
    expect(el.category_id).toBe('ai__decision')
  })

  it('rejects an element with an empty category_id', () => {
    const result = ElementSchema.safeParse({ ...base, category_id: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an element carrying a legacy category_ids array', () => {
    const { category_id: _discard, ...rest } = base
    const result = ElementSchema.safeParse({ ...rest, category_ids: ['ai__decision'] })
    // Missing the required singular `category_id`; Zod fails.
    expect(result.success).toBe(false)
  })

  it('accepts element with only en locale (semantic layer enforces minimum)', () => {
    const result = ElementSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('rejects element missing title', () => {
    const { title: _title, ...noTitle } = base
    const result = ElementSchema.safeParse(noTitle)
    expect(result.success).toBe(false)
  })

  it('rejects element missing symbol_id', () => {
    const { symbol_id: _symbol, ...noSymbol } = base
    const result = ElementSchema.safeParse(noSymbol)
    expect(result.success).toBe(false)
  })

  it('rejects symbol_id with invalid chars like "/"', () => {
    const result = ElementSchema.safeParse({ ...base, symbol_id: 'symbols/signal' })
    expect(result.success).toBe(false)
  })

  it('rejects symbol_id with an extension like ".svg"', () => {
    const result = ElementSchema.safeParse({ ...base, symbol_id: 'signal.svg' })
    expect(result.success).toBe(false)
  })

  it('ignores a stray icon field rather than failing (non-strict schema)', () => {
    // The schema does not use .strict(), so unknown fields (including a
    // legacy `icon:` object) parse through and are silently dropped.
    const parsed = ElementSchema.safeParse({
      ...base,
      icon: { url: '/dtpr-icons/foo.svg', format: 'svg', alt_text: [loc('en', 'x')] },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect((parsed.data as Record<string, unknown>).icon).toBeUndefined()
    }
  })
})

describe('CategorySchema', () => {
  const base = {
    id: 'functional_modes',
    name: [loc('en', 'Functional Modes')],
    description: [loc('en', 'How this AI system operates.')],
    datachain_type: 'ai',
    shape: 'hexagon',
  }

  it('rejects a category id with disallowed characters', () => {
    const result = CategorySchema.safeParse({ ...base, id: 'has spaces' })
    expect(result.success).toBe(false)
  })

  it('accepts a legacy ai__ category id (regex permits `__`; convention prefers bare slugs)', () => {
    const result = CategorySchema.safeParse({ ...base, id: 'ai__decision' })
    expect(result.success).toBe(true)
  })

  it('parses a minimal category with defaults', () => {
    const cat = CategorySchema.parse(base)
    expect(cat.required).toBe(false)
    expect(cat.order).toBe(0)
    expect(cat.element_variables).toEqual([])
    expect(cat.prompt).toEqual([])
    expect(cat.context).toBeUndefined()
    expect(cat.shape).toBe('hexagon')
  })

  it('rejects a category missing shape', () => {
    const { shape: _shape, ...noShape } = base
    const result = CategorySchema.safeParse(noShape)
    expect(result.success).toBe(false)
  })

  it('rejects an unknown shape with valid-values surfaced by Zod', () => {
    const result = CategorySchema.safeParse({ ...base, shape: 'triangle' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues.map((i) => i.message).join(' ')
      // Zod's enum error includes the list of valid options.
      expect(msg).toMatch(/hexagon/)
      expect(msg).toMatch(/circle/)
      expect(msg).toMatch(/rounded-square/)
      expect(msg).toMatch(/octagon/)
    }
  })

  it('accepts an optional context block with values', () => {
    const withCtx = CategorySchema.parse({
      ...base,
      context: {
        id: 'level_of_autonomy',
        name: [loc('en', 'Level of Autonomy')],
        description: [loc('en', 'Human involvement.')],
        values: [
          {
            id: 'ai_only',
            name: [loc('en', 'AI decides and executes')],
            description: [loc('en', 'No human in the loop.')],
            color: '#F28C28',
          },
        ],
      },
    })
    expect(withCtx.context?.values).toHaveLength(1)
  })

  it('rejects invalid color in context value', () => {
    const result = CategorySchema.safeParse({
      ...base,
      context: {
        id: 'x',
        name: [loc('en', 'X')],
        description: [loc('en', 'X')],
        values: [
          {
            id: 'v1',
            name: [loc('en', 'V1')],
            description: [loc('en', 'd')],
            color: 'red',
          },
        ],
      },
    })
    expect(result.success).toBe(false)
  })
})

describe('DatachainTypeSchema', () => {
  it('parses a valid ai datachain type', () => {
    const dt = DatachainTypeSchema.parse({
      id: 'ai',
      name: [loc('en', 'AI / Algorithm')],
      categories: ['access', 'functional_modes'],
      locales: ['en', 'es'],
    })
    expect(dt.categories).toHaveLength(2)
    expect(dt.subchains).toEqual([])
  })

  it('parses a datachain type with optional subchains', () => {
    const dt = DatachainTypeSchema.parse({
      id: 'ai',
      name: [loc('en', 'AI / Algorithm')],
      categories: ['input_dataset', 'processing', 'output_dataset'],
      subchains: [
        {
          id: 'data_flow',
          name: [loc('en', 'Data Flow')],
          categories: ['input_dataset', 'processing', 'output_dataset'],
        },
      ],
      locales: ['en'],
    })
    expect(dt.subchains).toHaveLength(1)
    expect(dt.subchains[0]?.categories).toEqual([
      'input_dataset',
      'processing',
      'output_dataset',
    ])
  })

  it('rejects empty categories array', () => {
    const result = DatachainTypeSchema.safeParse({
      id: 'ai',
      name: [loc('en', 'AI')],
      categories: [],
      locales: ['en'],
    })
    expect(result.success).toBe(false)
  })
})

describe('SchemaManifestSchema', () => {
  it('parses a valid beta manifest', () => {
    const m = SchemaManifestSchema.parse({
      version: 'ai@2026-04-16-beta',
      status: 'beta',
      created_at: '2026-04-16T00:00:00.000Z',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: ['en'],
    })
    expect(m.notes).toBe('')
  })

  it('rejects malformed version string', () => {
    const result = SchemaManifestSchema.safeParse({
      version: 'ai@2026-04', // incomplete date
      status: 'beta',
      created_at: '2026-04-16T00:00:00.000Z',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: ['en'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects content_hash without sha256- prefix', () => {
    const result = SchemaManifestSchema.safeParse({
      version: 'ai@2026-04-16',
      status: 'stable',
      created_at: '2026-04-16T00:00:00.000Z',
      content_hash: '0'.repeat(64),
      locales: ['en'],
    })
    expect(result.success).toBe(false)
  })
})

describe('DatachainInstanceSchema', () => {
  const base = {
    id: 'worcester-parking-lpr',
    schema_version: 'ai@2026-04-16',
    created_at: '2026-04-16T12:00:00.000Z',
    elements: [
      { element_id: 'accept_deny' },
      { element_id: 'identifiable_video', priority: 2 },
    ],
  }

  it('parses a minimal instance with defaulted fields', () => {
    const inst = DatachainInstanceSchema.parse(base)
    expect(inst.elements[0]?.priority).toBe(0)
    expect(inst.elements[0]?.variables).toEqual([])
  })

  it('rejects negative priority', () => {
    const result = DatachainInstanceSchema.safeParse({
      ...base,
      elements: [{ element_id: 'x', priority: -1 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects 0 elements', () => {
    const result = DatachainInstanceSchema.safeParse({ ...base, elements: [] })
    expect(result.success).toBe(false)
  })
})
