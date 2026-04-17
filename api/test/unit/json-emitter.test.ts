import { describe, it, expect } from 'vitest'
import { buildBundle, bundleToFiles, materializeVariables } from '../../cli/lib/json-emitter.ts'
import type { Category } from '../../src/schema/category.ts'
import type { Element } from '../../src/schema/element.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'
import type { SchemaVersionSource } from '../../src/validator/types.ts'

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
