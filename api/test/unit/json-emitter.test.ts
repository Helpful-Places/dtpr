import { describe, it, expect } from 'vitest'
import {
  buildBundle,
  bundleToFiles,
  iconVariantsFor,
  materializeVariables,
} from '../../cli/lib/json-emitter.ts'
import type { Category } from '../../src/schema/category.ts'
import type { Element } from '../../src/schema/element.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'
import type { SchemaVersionSource } from '../../src/validator/types.ts'

const SYMBOL_CLOUD = `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><path d="M10 10h16v16H10z" fill="currentColor"/></svg>`
const SYMBOL_ACCEPT_DENY = `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h28v28H4z" fill="currentColor"/></svg>`

const loc = (locale: LocaleCode, value: string): LocaleValue => ({ locale, value })

function makeSource(): SchemaVersionSource {
  const categories: Category[] = [
    {
      id: 'ai__storage',
      name: [loc('en', 'Storage')],
      description: [loc('en', 'Where data is held.')],
      prompt: [],
      required: false,
      order: 1,
      datachain_type: 'ai',
      shape: 'rounded-square',
      element_variables: [
        { id: 'retention_period', label: [loc('en', 'Retention')], required: true },
      ],
    },
    {
      id: 'ai__decision',
      name: [loc('en', 'Decision')],
      description: [loc('en', 'Decision type.')],
      prompt: [],
      required: true,
      order: 2,
      datachain_type: 'ai',
      shape: 'hexagon',
      element_variables: [],
    },
  ]
  const elements: Element[] = [
    {
      id: 'cloud_storage',
      category_id: 'ai__storage',
      title: [loc('en', 'Cloud storage'), loc('es', 'Almacenamiento en la nube')],
      description: [loc('en', 'Held for {{retention_period}}.')],
      citation: [],
      symbol_id: 'cloud',
      variables: [],
    },
    {
      id: 'accept_deny',
      category_id: 'ai__decision',
      title: [loc('en', 'Accept or deny')],
      description: [loc('en', 'Binary yes/no.')],
      citation: [],
      symbol_id: 'accept_deny',
      variables: [],
    },
  ]
  return {
    manifest: {
      version: 'ai@2026-04-16-beta',
      status: 'beta',
      created_at: '2026-04-16T00:00:00.000Z',
      notes: '',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: ['en', 'es'],
    },
    datachainType: {
      id: 'ai',
      name: [loc('en', 'AI')],
      description: [],
      categories: ['ai__storage', 'ai__decision'],
      locales: ['en', 'es'],
    },
    categories,
    elements,
    symbols: {
      cloud: SYMBOL_CLOUD,
      accept_deny: SYMBOL_ACCEPT_DENY,
    },
  }
}

describe('materializeVariables', () => {
  it('copies element_variables from every category the element belongs to', () => {
    const src = makeSource()
    const materialized = materializeVariables(src.elements[0]!, src.categories)
    expect(materialized.map((v) => v.id)).toEqual(['retention_period'])
  })

  it('is additive — existing element variables are preserved', () => {
    const src = makeSource()
    const el: Element = {
      ...src.elements[0]!,
      variables: [{ id: 'extra', label: [loc('en', 'Extra')], required: false }],
    }
    const materialized = materializeVariables(el, src.categories)
    expect(materialized.map((v) => v.id).sort()).toEqual(['extra', 'retention_period'])
  })
})

describe('buildBundle', () => {
  it('materializes variables onto each element', () => {
    const bundle = buildBundle(makeSource())
    const cloud = bundle.elements.find((e) => e.id === 'cloud_storage')!
    expect(cloud.variables.map((v) => v.id)).toEqual(['retention_period'])
  })

  it('stamps a non-sentinel content_hash on the manifest', () => {
    const bundle = buildBundle(makeSource())
    expect(bundle.manifest.content_hash).toMatch(/^sha256-[0-9a-f]{64}$/)
    expect(bundle.manifest.content_hash).not.toBe(`sha256-${'0'.repeat(64)}`)
  })

  it('hash is deterministic for equal sources', () => {
    const a = buildBundle(makeSource())
    const b = buildBundle(makeSource())
    expect(a.manifest.content_hash).toBe(b.manifest.content_hash)
  })

  it('hash changes when a source element changes', () => {
    const src = makeSource()
    const a = buildBundle(src)
    src.elements[0]!.title = [loc('en', 'Different title')]
    const b = buildBundle(src)
    expect(a.manifest.content_hash).not.toBe(b.manifest.content_hash)
  })

  it('builds a search index per locale', () => {
    const bundle = buildBundle(makeSource())
    expect(Object.keys(bundle.searchIndexesByLocale).sort()).toEqual(['en', 'es'])
    expect(typeof bundle.searchIndexesByLocale.en).toBe('string')
  })

  it('emits JSON Schema for every content schema', () => {
    const bundle = buildBundle(makeSource())
    expect(Object.keys(bundle.schemaJson).sort()).toEqual([
      'Category',
      'DatachainInstance',
      'DatachainType',
      'Element',
      'Manifest',
    ])
  })
})

describe('bundleToFiles', () => {
  it('produces the expected file layout', () => {
    const files = bundleToFiles(buildBundle(makeSource()))
    expect(files['manifest.json']).toBeDefined()
    expect(files['datachain-type.json']).toBeDefined()
    expect(files['categories.json']).toBeDefined()
    expect(files['elements.json']).toBeDefined()
    expect(files['schema.json']).toBeDefined()
    expect(files['elements/cloud_storage.json']).toBeDefined()
    expect(files['elements/accept_deny.json']).toBeDefined()
    expect(files['search-index.en.json']).toBeDefined()
    expect(files['search-index.es.json']).toBeDefined()
  })

  it('each per-element file is valid JSON for that element', () => {
    const files = bundleToFiles(buildBundle(makeSource()))
    const el = JSON.parse(files['elements/cloud_storage.json']!) as { id: string }
    expect(el.id).toBe('cloud_storage')
  })
})

// -------- Unit 3: shape/icon_variants materialization, symbols + pre-bake --------

/** Build a source whose `ai__decision` category carries a context. */
function makeSourceWithContext(): SchemaVersionSource {
  const src = makeSource()
  src.categories[1]!.context = {
    id: 'level_of_autonomy',
    name: [loc('en', 'Autonomy')],
    description: [loc('en', 'Autonomy')],
    values: [
      {
        id: 'ai_only',
        name: [loc('en', 'AI only')],
        description: [loc('en', 'AI only')],
        color: '#F28C28',
      },
      {
        id: 'ai_flags_human_decides',
        name: [loc('en', 'Human in loop')],
        description: [loc('en', 'Human in loop')],
        color: '#4A90D9',
      },
    ],
  }
  return src
}

describe('iconVariantsFor', () => {
  it('returns [default, dark] when the category has no context', () => {
    const src = makeSource()
    expect(iconVariantsFor(src.categories[0])).toEqual(['default', 'dark'])
  })

  it('appends context value ids in declared order', () => {
    const src = makeSourceWithContext()
    const decision = src.categories.find((c) => c.id === 'ai__decision')!
    expect(iconVariantsFor(decision)).toEqual([
      'default',
      'dark',
      'ai_only',
      'ai_flags_human_decides',
    ])
  })
})

describe('buildBundle — element materialization', () => {
  it('emitted element includes symbol_id, shape, and icon_variants', () => {
    const bundle = buildBundle(makeSource())
    const cloud = bundle.elements.find((e) => e.id === 'cloud_storage')!
    expect(cloud.symbol_id).toBe('cloud')
    expect(cloud.shape).toBe('rounded-square')
    expect(cloud.icon_variants).toEqual(['default', 'dark'])
  })

  it('shape is derived from the element category', () => {
    const bundle = buildBundle(makeSource())
    const accept = bundle.elements.find((e) => e.id === 'accept_deny')!
    expect(accept.shape).toBe('hexagon')
  })

  it('icon_variants grows with context values', () => {
    const bundle = buildBundle(makeSourceWithContext())
    const accept = bundle.elements.find((e) => e.id === 'accept_deny')!
    expect(accept.icon_variants).toEqual([
      'default',
      'dark',
      'ai_only',
      'ai_flags_human_decides',
    ])
  })
})

describe('buildBundle — composed icons + hashing', () => {
  it('composes exactly one SVG per (element × variant) pair', () => {
    const bundle = buildBundle(makeSourceWithContext())
    const expectedCount =
      bundle.elements.reduce((n, e) => n + e.icon_variants.length, 0)
    expect(Object.keys(bundle.composedIcons).length).toBe(expectedCount)
    // Spot-check a key shape.
    expect(bundle.composedIcons['accept_deny/default']).toMatch(/^<svg /)
    expect(bundle.composedIcons['accept_deny/ai_only']).toMatch(/#F28C28/)
  })

  it('category with no context emits exactly 2 composed icons per element', () => {
    const bundle = buildBundle(makeSource())
    for (const el of bundle.elements) {
      expect(bundle.composedIcons[`${el.id}/default`]).toBeDefined()
      expect(bundle.composedIcons[`${el.id}/dark`]).toBeDefined()
    }
    // 2 elements × 2 variants = 4 composed icons.
    expect(Object.keys(bundle.composedIcons).length).toBe(4)
  })

  it('editing a symbol SVG changes content_hash with no YAML change', () => {
    const src = makeSource()
    const before = buildBundle(src).manifest.content_hash
    src.symbols.cloud = src.symbols.cloud!.replace(
      'M10 10h16v16H10z',
      'M8 8h20v20H8z',
    )
    const after = buildBundle(src).manifest.content_hash
    expect(after).not.toBe(before)
  })

  it('editing a ContextValue.color changes composed bytes and content_hash', () => {
    const src1 = makeSourceWithContext()
    const src2 = makeSourceWithContext()
    src2.categories[1]!.context!.values[0]!.color = '#BB4400'
    const a = buildBundle(src1)
    const b = buildBundle(src2)
    expect(a.composedIcons['accept_deny/ai_only']).not.toBe(
      b.composedIcons['accept_deny/ai_only'],
    )
    expect(a.manifest.content_hash).not.toBe(b.manifest.content_hash)
  })
})

describe('bundleToFiles — symbols and pre-baked icons', () => {
  it('includes symbols/<id>.svg for every loaded symbol', () => {
    const files = bundleToFiles(buildBundle(makeSource()))
    expect(files['symbols/cloud.svg']).toContain('<svg')
    expect(files['symbols/accept_deny.svg']).toContain('<svg')
  })

  it('includes icons/<element_id>/<variant>.svg for every pair', () => {
    const files = bundleToFiles(buildBundle(makeSourceWithContext()))
    expect(files['icons/accept_deny/default.svg']).toBeDefined()
    expect(files['icons/accept_deny/dark.svg']).toBeDefined()
    expect(files['icons/accept_deny/ai_only.svg']).toBeDefined()
    expect(files['icons/accept_deny/ai_flags_human_decides.svg']).toBeDefined()
    // Each composed SVG starts with the outer wrapper.
    expect(files['icons/accept_deny/default.svg']).toMatch(/^<svg /)
  })
})
