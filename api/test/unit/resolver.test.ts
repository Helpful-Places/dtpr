import { describe, expect, it } from 'vitest'
import { resolve, type SchemaContext } from '../../src/resolver/resolve.ts'
import { canonicalStringify } from '../../src/resolver/canonical-stringify.ts'
import { DatachainInstanceSchema } from '../../src/schema/datachain-instance.ts'
import type { Category } from '../../src/schema/category.ts'
import type { DatachainType } from '../../src/schema/datachain-type.ts'
import type { Element } from '../../src/schema/element.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'
import type { SchemaManifest } from '../../src/schema/manifest.ts'

// ---------------- fixture helpers ----------------

const loc = (locale: LocaleCode, value: string): LocaleValue => ({ locale, value })

function makeManifest(locales: LocaleCode[] = ['en']): SchemaManifest {
  return {
    version: 'ai@2026-04-16-beta',
    status: 'beta',
    created_at: '2026-04-16T00:00:00.000Z',
    notes: '',
    content_hash: 'sha256-' + 'a'.repeat(64),
    locales,
  }
}

function makeDatachainType(opts: Partial<DatachainType> = {}): DatachainType {
  return {
    id: 'ai',
    name: [loc('en', 'AI')],
    description: [],
    categories: ['cat-a', 'cat-b'],
    subchains: [],
    locales: ['en'],
    sources: [],
    ...opts,
  }
}

function makeCategory(id: string, opts: Partial<Category> = {}): Category {
  return {
    id,
    name: [loc('en', `Category ${id}`)],
    description: [loc('en', 'desc')],
    prompt: [],
    authoring_guidance: [],
    examples: [],
    sources: [],
    required: false,
    order: 0,
    datachain_type: 'ai',
    shape: 'hexagon',
    element_variables: [],
    ...opts,
  }
}

function makeElement(id: string, categoryId: string, opts: Partial<Element> = {}): Element {
  return {
    id,
    category_id: categoryId,
    title: [loc('en', `Element ${id}`)],
    description: [loc('en', 'desc')],
    citation: [],
    authoring_guidance: [],
    examples: [],
    sources: [],
    symbol_id: 'sym',
    variables: [],
    ...opts,
  }
}

function makeSchemaContext(opts: {
  manifestLocales?: LocaleCode[]
  categories: Category[]
  elements: Element[]
  datachainType?: DatachainType
}): SchemaContext {
  return {
    manifest: makeManifest(opts.manifestLocales ?? ['en']),
    datachain_type: opts.datachainType ?? makeDatachainType(),
    categories: opts.categories,
    elements: opts.elements,
  }
}

function thinInstance(elementIds: string[]) {
  return DatachainInstanceSchema.parse({
    id: 'inst-1',
    schema_version: 'ai@2026-04-16-beta',
    created_at: '2026-04-16T00:00:00.000Z',
    elements: elementIds.map((id) => ({ element_id: id })),
  })
}

// ---------------- tests ----------------

describe('resolve', () => {
  it('happy path: 2 elements across 2 categories → snapshot has those 2 + 2 + full datachain-type', () => {
    const elA1 = makeElement('el-a1', 'cat-a')
    const elA2 = makeElement('el-a2', 'cat-a')
    const elB1 = makeElement('el-b1', 'cat-b')
    const ctx = makeSchemaContext({
      categories: [makeCategory('cat-a'), makeCategory('cat-b'), makeCategory('cat-c')],
      elements: [elA1, elA2, elB1, makeElement('el-c1', 'cat-c')],
    })
    const thin = thinInstance(['el-a1', 'el-b1'])

    const out = resolve(thin, ctx)

    expect(out.schema_snapshot.elements.map((e) => e.id)).toEqual(['el-a1', 'el-b1'])
    expect(out.schema_snapshot.categories.map((c) => c.id)).toEqual(['cat-a', 'cat-b'])
    expect(out.schema_snapshot.datachain_type.id).toBe('ai')
    expect(out.suggested_elements).toEqual([])
    expect(out.authoring_provenance).toBeUndefined()
  })

  it('R6: required category included even when no placement covers it', () => {
    const ctx = makeSchemaContext({
      categories: [
        makeCategory('cat-a', { required: true }),
        makeCategory('cat-b'),
      ],
      elements: [makeElement('el-b1', 'cat-b')],
    })
    const thin = thinInstance(['el-b1'])

    const out = resolve(thin, ctx)

    expect(out.schema_snapshot.categories.map((c) => c.id).sort()).toEqual(['cat-a', 'cat-b'])
    // No element from cat-a is pulled in; only categories pin via the required rule.
    expect(out.schema_snapshot.elements.map((e) => e.id)).toEqual(['el-b1'])
  })

  it('edge: empty placements → empty categories/elements + full datachain-type', () => {
    // DatachainInstanceSchema requires elements.min(1), so build the parsed
    // shape by hand to model the degenerate case.
    const thin = {
      id: 'inst-empty',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [],
      subchain_instances: [],
      sources: [],
      linked_instance_ids: [],
    } as Parameters<typeof resolve>[0]
    const ctx = makeSchemaContext({
      categories: [makeCategory('cat-a'), makeCategory('cat-b')],
      elements: [makeElement('el-a1', 'cat-a')],
    })

    const out = resolve(thin, ctx)

    expect(out.schema_snapshot.categories).toEqual([])
    expect(out.schema_snapshot.elements).toEqual([])
    expect(out.schema_snapshot.datachain_type.id).toBe('ai')
  })

  it('edge: locale ordering — manifest [en, fr], element locales [fr, en] → resolved [en, fr]', () => {
    const el = makeElement('el-x', 'cat-a', {
      title: [loc('fr', 'Titre'), loc('en', 'Title')],
      description: [loc('fr', 'desc-fr'), loc('en', 'desc-en')],
    })
    const ctx = makeSchemaContext({
      manifestLocales: ['en', 'fr'],
      categories: [
        makeCategory('cat-a', {
          name: [loc('fr', 'Cat-FR'), loc('en', 'Cat-EN')],
        }),
      ],
      elements: [el],
      datachainType: makeDatachainType({
        name: [loc('fr', 'AI-FR'), loc('en', 'AI-EN')],
        locales: ['en', 'fr'],
      }),
    })
    const thin = thinInstance(['el-x'])

    const out = resolve(thin, ctx)

    expect(out.schema_snapshot.elements[0]?.title.map((l) => l.locale)).toEqual(['en', 'fr'])
    expect(out.schema_snapshot.elements[0]?.description.map((l) => l.locale)).toEqual(['en', 'fr'])
    expect(out.schema_snapshot.categories[0]?.name.map((l) => l.locale)).toEqual(['en', 'fr'])
    expect(out.schema_snapshot.datachain_type.name.map((l) => l.locale)).toEqual(['en', 'fr'])
  })

  it('edge: object-key ordering — twice over same input → byte-identical via canonicalStringify', () => {
    const ctx = makeSchemaContext({
      categories: [makeCategory('cat-a')],
      elements: [makeElement('el-a1', 'cat-a')],
    })
    const thin = thinInstance(['el-a1'])

    const a = canonicalStringify(resolve(thin, ctx))
    const b = canonicalStringify(resolve(thin, ctx))
    expect(a).toBe(b)
  })

  it('determinism: 100 runs over the same input yield identical canonical strings', () => {
    const ctx = makeSchemaContext({
      categories: [makeCategory('cat-a'), makeCategory('cat-b')],
      elements: [makeElement('el-a1', 'cat-a'), makeElement('el-b1', 'cat-b')],
    })
    const thin = thinInstance(['el-a1', 'el-b1'])

    const expected = canonicalStringify(resolve(thin, ctx))
    for (let i = 0; i < 100; i++) {
      expect(canonicalStringify(resolve(thin, ctx))).toBe(expected)
    }
  })

  it('edge: default-population determinism — elided vs explicit Zod defaults produce byte-identical bundles', () => {
    const ctx = makeSchemaContext({
      categories: [makeCategory('cat-a')],
      elements: [makeElement('el-a1', 'cat-a')],
    })

    // Two thin inputs differing only in elided defaults.
    const elided = DatachainInstanceSchema.parse({
      id: 'inst-1',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'el-a1' }],
    })
    const explicit = DatachainInstanceSchema.parse({
      id: 'inst-1',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'el-a1', priority: 0, variables: [], actions: [], sources: [] }],
      subchain_instances: [],
      sources: [],
      linked_instance_ids: [],
    })

    const a = canonicalStringify(resolve(elided, ctx))
    const b = canonicalStringify(resolve(explicit, ctx))
    expect(a).toBe(b)
  })

  it('round-trip (R3, R4): parse(thin) → resolve → strip → parse equals parse(thin)', () => {
    const ctx = makeSchemaContext({
      categories: [makeCategory('cat-a')],
      elements: [makeElement('el-a1', 'cat-a')],
    })
    const thinSource = {
      id: 'inst-rt',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'el-a1' }],
    }
    const parsedThin = DatachainInstanceSchema.parse(thinSource)
    const resolved = resolve(parsedThin, ctx)

    const {
      schema_snapshot: _ss,
      suggested_elements: _se,
      authoring_provenance: _ap,
      ...stripped
    } = resolved
    void _ss
    void _se
    void _ap

    const reparsed = DatachainInstanceSchema.parse(stripped)
    expect(reparsed).toEqual(parsedThin)
  })

  it('defensive: instance.elements references unknown element_id → throws', () => {
    const ctx = makeSchemaContext({
      categories: [makeCategory('cat-a')],
      elements: [makeElement('el-a1', 'cat-a')],
    })
    const thin = thinInstance(['el-missing'])

    expect(() => resolve(thin, ctx)).toThrow(/unknown element/i)
  })

  it('integration with U1: canonicalStringify of a representative resolved bundle is < 512 KB', () => {
    // Build a representative datachain — 5 categories, 6 elements per category, 2 locales.
    const locales: LocaleCode[] = ['en', 'fr']
    const categories: Category[] = []
    const elements: Element[] = []
    for (let c = 0; c < 5; c++) {
      const catId = `cat-${c}`
      categories.push(
        makeCategory(catId, {
          name: locales.map((l) => loc(l, `Category ${catId} (${l})`)),
          description: locales.map((l) => loc(l, `Description for ${catId} (${l})`)),
        }),
      )
      for (let e = 0; e < 6; e++) {
        const elId = `el-${c}-${e}`
        elements.push(
          makeElement(elId, catId, {
            title: locales.map((l) => loc(l, `Element ${elId} (${l})`)),
            description: locales.map((l) => loc(l, `Long description text for ${elId} (${l})`)),
          }),
        )
      }
    }
    const ctx = makeSchemaContext({
      manifestLocales: locales,
      categories,
      elements,
      datachainType: makeDatachainType({
        categories: categories.map((c) => c.id),
        locales,
      }),
    })
    // Place every element so the snapshot covers the full set.
    const thin = thinInstance(elements.map((e) => e.id))

    const out = resolve(thin, ctx)
    const serialized = canonicalStringify(out)
    expect(serialized.length).toBeLessThan(512 * 1024)
  })

  it('elements and categories in the snapshot are sorted ascending by id', () => {
    const ctx = makeSchemaContext({
      categories: [makeCategory('cat-z'), makeCategory('cat-a'), makeCategory('cat-m')],
      elements: [
        makeElement('el-z1', 'cat-z'),
        makeElement('el-a1', 'cat-a'),
        makeElement('el-m1', 'cat-m'),
      ],
    })
    const thin = thinInstance(['el-z1', 'el-a1', 'el-m1'])
    const out = resolve(thin, ctx)
    expect(out.schema_snapshot.categories.map((c) => c.id)).toEqual(['cat-a', 'cat-m', 'cat-z'])
    expect(out.schema_snapshot.elements.map((e) => e.id)).toEqual(['el-a1', 'el-m1', 'el-z1'])
  })
})
