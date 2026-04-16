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
const icon = () => ({
  url: '/dtpr-icons/foo.svg',
  format: 'svg',
  alt_text: [loc('en', 'Foo icon')],
})

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
    category_ids: ['ai__decision'],
    title: [loc('en', 'Accept or deny')],
    description: [loc('en', 'Binary yes/no decision.')],
    icon: icon(),
  }

  it('parses a minimal element with defaults', () => {
    const el = ElementSchema.parse(base)
    expect(el.citation).toEqual([])
    expect(el.variables).toEqual([])
  })

  it('rejects an element with 0 category_ids', () => {
    const result = ElementSchema.safeParse({ ...base, category_ids: [] })
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

  it('rejects element with invalid icon (empty url)', () => {
    const result = ElementSchema.safeParse({ ...base, icon: { ...icon(), url: '' } })
    expect(result.success).toBe(false)
  })
})

describe('CategorySchema', () => {
  const base = {
    id: 'ai__decision',
    name: [loc('en', 'Decision Type')],
    description: [loc('en', 'Type of decision being made.')],
    datachain_type: 'ai',
  }

  it('parses a minimal category with defaults', () => {
    const cat = CategorySchema.parse(base)
    expect(cat.required).toBe(false)
    expect(cat.order).toBe(0)
    expect(cat.element_variables).toEqual([])
    expect(cat.prompt).toEqual([])
    expect(cat.context).toBeUndefined()
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
      categories: ['ai__access', 'ai__decision'],
      locales: ['en', 'es'],
    })
    expect(dt.categories).toHaveLength(2)
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
