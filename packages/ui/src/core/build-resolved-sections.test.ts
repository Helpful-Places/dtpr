import { describe, it, expect } from 'vitest'
import { buildResolvedSections } from './build-resolved-sections.js'
import type {
  AuthoringProvenance,
  Category,
  DatachainInstance,
  Element,
  InstanceElement,
  LocaleValue,
  ResolvedDatachainInstance,
  SchemaSnapshot,
} from './types.js'

// ---- Tiny test-data factories. Trims the schema noise so each test
// reads as a tight setup + assertion. The cast through Element /
// Category / etc. is deliberate: the underlying Zod schemas have
// `default([])` on a few fields whose materialized output type carries
// the array even when input omits it. The test fixtures are minimal
// inputs; the helper under test reads only the fields it needs.

// LocaleCodeSchema in @dtpr/api/schema is currently a closed union of
// 'en' | 'fr'. Tests cast through `as LocaleValue` because some
// scenarios exercise locale fallthrough by requesting an unknown
// locale code at the call site (the `extract` helper, not the
// LocaleValue array, accepts arbitrary strings for the requested
// locale).
const loc = (locale: string, value: string): LocaleValue =>
  ({ locale, value }) as LocaleValue

function makeCategory(id: string, name: string, order: number = 0): Category {
  return {
    id,
    name: [loc('en', name)],
    description: [loc('en', `${name} description.`)],
    prompt: [],
    authoring_guidance: [],
    examples: [],
    sources: [],
    required: false,
    order,
    datachain_type: 'ai',
    shape: 'rounded-square',
    element_variables: [],
  } as Category
}

function makeElement(id: string, category_id: string, title: string): Element {
  return {
    id,
    category_id,
    title: [loc('en', title)],
    description: [loc('en', `${title} description.`)],
    citation: [],
    authoring_guidance: [],
    examples: [],
    sources: [],
    symbol_id: 'square',
    variables: [],
  } as Element
}

function makePlacement(element_id: string, priority: number = 0): InstanceElement {
  return {
    element_id,
    priority,
    variables: [],
    actions: [],
    sources: [],
  } as InstanceElement
}

interface MakeResolvedOpts {
  categories: Category[]
  declaredCategoryIds?: string[]
  snapshotElements: Element[]
  suggestedElements?: Element[]
  placements: InstanceElement[]
  provenance?: AuthoringProvenance
}

function makeResolved(opts: MakeResolvedOpts): ResolvedDatachainInstance {
  const declared = opts.declaredCategoryIds ?? opts.categories.map((c) => c.id)
  const snapshot: SchemaSnapshot = {
    datachain_type: {
      id: 'ai',
      name: [loc('en', 'AI')],
      description: [],
      categories: declared,
      subchains: [],
      locales: ['en'],
      sources: [],
    },
    categories: opts.categories,
    elements: opts.snapshotElements,
  }

  const base: DatachainInstance = {
    id: 'test-instance',
    schema_version: 'ai@2026-04-16-beta',
    created_at: '2026-05-07T00:00:00.000Z',
    elements: opts.placements,
    subchain_instances: [],
    sources: [],
    linked_instance_ids: [],
  }

  return {
    ...base,
    schema_snapshot: snapshot,
    suggested_elements: opts.suggestedElements ?? [],
    ...(opts.provenance ? { authoring_provenance: opts.provenance } : {}),
  } as ResolvedDatachainInstance
}

describe('buildResolvedSections', () => {
  it('happy path: 2 snapshot elements, no suggested → 2 sections; proposed=false everywhere; provenance undefined', () => {
    const cats = [makeCategory('storage', 'Storage'), makeCategory('purpose', 'Purpose')]
    const els = [
      makeElement('cloud_storage', 'storage', 'Cloud storage'),
      makeElement('analytics', 'purpose', 'Analytics'),
    ]
    const resolved = makeResolved({
      categories: cats,
      snapshotElements: els,
      placements: [makePlacement('cloud_storage'), makePlacement('analytics')],
    })

    const sections = buildResolvedSections(resolved, 'en')

    expect(sections).toHaveLength(2)
    expect(sections.map((s) => s.id)).toEqual(['storage', 'purpose'])
    expect(sections[0]?.title).toBe('Storage')
    expect(sections[0]?.elements).toHaveLength(1)
    expect(sections[0]?.elements[0]?.title).toBe('Cloud storage')
    for (const s of sections) {
      for (const el of s.elements) {
        expect(el.proposed).toBe(false)
        expect(el.provenance).toBeUndefined()
      }
    }
  })

  it('1 snapshot + 1 suggested + ai_generated provenance: per-element provenance composed from element_provenance map', () => {
    const cats = [makeCategory('storage', 'Storage'), makeCategory('purpose', 'Purpose')]
    const snap = [makeElement('cloud_storage', 'storage', 'Cloud storage')]
    const sug = [makeElement('analytics', 'purpose', 'Analytics')]
    const provenance: AuthoringProvenance = {
      kind: 'ai_generated',
      model: 'claude-sonnet-4-6',
      generated_at: '2026-05-08T00:00:00.000Z',
      element_provenance: {
        cloud_storage: {
          rationale: 'Document mentions S3 buckets.',
          confidence: 'high',
          source_references: [{ quote: 'data is stored in AWS S3', context: 'Architecture §2' }],
        },
        analytics: {
          rationale: 'Inferred from KPI dashboard reference.',
          confidence: 'medium',
        },
      },
    }
    const resolved = makeResolved({
      categories: cats,
      snapshotElements: snap,
      suggestedElements: sug,
      placements: [makePlacement('cloud_storage'), makePlacement('analytics')],
      provenance,
    })

    const sections = buildResolvedSections(resolved, 'en')

    const all = sections.flatMap((s) => s.elements)
    expect(all).toHaveLength(2)
    const cloud = all.find((e) => e.title === 'Cloud storage')!
    const analytics = all.find((e) => e.title === 'Analytics')!
    expect(cloud.proposed).toBe(false)
    expect(analytics.proposed).toBe(true)
    // Each element gets its own composed provenance (per-element entry +
    // whole-disclosure model/generated_at).
    expect(cloud.provenance).toEqual({
      kind: 'ai_generated',
      rationale: 'Document mentions S3 buckets.',
      confidence: 'high',
      source_references: [{ quote: 'data is stored in AWS S3', context: 'Architecture §2' }],
      model: 'claude-sonnet-4-6',
      generated_at: '2026-05-08T00:00:00.000Z',
    })
    expect(analytics.provenance).toEqual({
      kind: 'ai_generated',
      rationale: 'Inferred from KPI dashboard reference.',
      confidence: 'medium',
      model: 'claude-sonnet-4-6',
      generated_at: '2026-05-08T00:00:00.000Z',
    })
  })

  it('ai_generated provenance with no element_provenance entry leaves provenance undefined for that element', () => {
    const cats = [makeCategory('storage', 'Storage')]
    const snap = [makeElement('cloud_storage', 'storage', 'Cloud storage')]
    const provenance: AuthoringProvenance = {
      kind: 'ai_generated',
      element_provenance: {
        // intentionally no entry for cloud_storage
        somewhere_else: { rationale: 'nope' },
      },
    }
    const resolved = makeResolved({
      categories: cats,
      snapshotElements: snap,
      placements: [makePlacement('cloud_storage')],
      provenance,
    })

    const sections = buildResolvedSections(resolved, 'en')
    expect(sections[0]?.elements[0]?.provenance).toBeUndefined()
  })

  it('human provenance: per-element provenance is undefined (nothing to render per element)', () => {
    const cats = [makeCategory('storage', 'Storage')]
    const snap = [makeElement('cloud_storage', 'storage', 'Cloud storage')]
    const provenance: AuthoringProvenance = { kind: 'human' }
    const resolved = makeResolved({
      categories: cats,
      snapshotElements: snap,
      placements: [makePlacement('cloud_storage')],
      provenance,
    })

    const sections = buildResolvedSections(resolved, 'en')
    expect(sections[0]?.elements[0]?.provenance).toBeUndefined()
  })

  it('options.proposedIndicator: false suppresses the proposed flag on suggested elements', () => {
    const cats = [makeCategory('purpose', 'Purpose')]
    const sug = [makeElement('analytics', 'purpose', 'Analytics')]
    const provenance: AuthoringProvenance = {
      kind: 'ai_generated',
      element_provenance: { analytics: { rationale: 'because' } },
    }
    const resolved = makeResolved({
      categories: cats,
      snapshotElements: [],
      suggestedElements: sug,
      placements: [makePlacement('analytics')],
      provenance,
    })

    const sections = buildResolvedSections(resolved, 'en', { proposedIndicator: false })
    const el = sections[0]?.elements[0]!
    expect(el.proposed).toBe(false)
    // Per-element provenance still composed — opt-out is on the indicator, not on provenance.
    expect(el.provenance).toMatchObject({ kind: 'ai_generated', rationale: 'because' })
  })

  it('locale fallthrough is delegated to deriveElementDisplay (helper does not interfere)', () => {
    // Element title only carries 'en' — request 'es' and rely on the
    // deriveElementDisplay fallback chain (default 'en').
    const cats = [makeCategory('storage', 'Storage')]
    const els = [makeElement('cloud_storage', 'storage', 'Cloud storage')]
    const resolved = makeResolved({
      categories: cats,
      snapshotElements: els,
      placements: [makePlacement('cloud_storage')],
    })

    const sections = buildResolvedSections(resolved, 'es')
    expect(sections[0]?.elements[0]?.title).toBe('Cloud storage')
  })

  it('collision (snapshot wins): an id present in both snapshot and suggested resolves to snapshot; proposed=false', () => {
    // Defensive behavior — validate_resolved rejects this on the wire,
    // but the helper still produces deterministic output.
    const cats = [makeCategory('storage', 'Storage')]
    const snapshotEl = makeElement('cloud_storage', 'storage', 'Cloud storage (snapshot)')
    const suggestedEl = makeElement('cloud_storage', 'storage', 'Cloud storage (suggested)')
    const provenance: AuthoringProvenance = {
      kind: 'ai_generated',
      element_provenance: { cloud_storage: { confidence: 'low' } },
    }
    // Use an unsafe build so we can exercise the collision case (the
    // schema's R15a refinement would otherwise reject this input).
    const resolved: ResolvedDatachainInstance = {
      ...makeResolved({
        categories: cats,
        snapshotElements: [snapshotEl],
        placements: [makePlacement('cloud_storage')],
        provenance,
      }),
      suggested_elements: [suggestedEl],
    } as ResolvedDatachainInstance

    const sections = buildResolvedSections(resolved, 'en')
    const el = sections[0]?.elements[0]!
    expect(el.title).toBe('Cloud storage (snapshot)')
    expect(el.proposed).toBe(false)
  })

  it('honors datachain_type.categories declared order when placements arrive out-of-order', () => {
    const a = makeCategory('alpha', 'Alpha')
    const b = makeCategory('beta', 'Beta')
    const c = makeCategory('gamma', 'Gamma')
    const els = [
      makeElement('e_a', 'alpha', 'A'),
      makeElement('e_b', 'beta', 'B'),
      makeElement('e_c', 'gamma', 'C'),
    ]
    const resolved = makeResolved({
      categories: [a, b, c],
      declaredCategoryIds: ['alpha', 'beta', 'gamma'],
      snapshotElements: els,
      // Placements out-of-order vs declared category order.
      placements: [makePlacement('e_c'), makePlacement('e_a'), makePlacement('e_b')],
    })

    const sections = buildResolvedSections(resolved, 'en')
    expect(sections.map((s) => s.id)).toEqual(['alpha', 'beta', 'gamma'])
    expect(sections[0]?.elements[0]?.title).toBe('A')
    expect(sections[1]?.elements[0]?.title).toBe('B')
    expect(sections[2]?.elements[0]?.title).toBe('C')
  })

  it('declared categories with no placements still emit an empty section', () => {
    const a = makeCategory('alpha', 'Alpha')
    const b = makeCategory('beta', 'Beta')
    const resolved = makeResolved({
      categories: [a, b],
      snapshotElements: [makeElement('e_a', 'alpha', 'A')],
      placements: [makePlacement('e_a')],
    })

    const sections = buildResolvedSections(resolved, 'en')
    expect(sections).toHaveLength(2)
    expect(sections[1]?.id).toBe('beta')
    expect(sections[1]?.elements).toEqual([])
  })

  it('throws when a placement element_id resolves into neither map', () => {
    const cats = [makeCategory('storage', 'Storage')]
    const resolved = makeResolved({
      categories: cats,
      snapshotElements: [],
      placements: [makePlacement('missing_element')],
    })

    expect(() => buildResolvedSections(resolved, 'en')).toThrow(/missing_element/)
  })

  it('integration: feeding output into renderDatachainDocument produces HTML containing both element titles', async () => {
    // Light integration — full HTML-shape coverage lives in U8.
    const { renderDatachainDocument } = await import('../html/document.js')
    const cats = [makeCategory('storage', 'Storage'), makeCategory('purpose', 'Purpose')]
    const snap = [makeElement('cloud_storage', 'storage', 'Cloud storage')]
    const sug = [makeElement('analytics', 'purpose', 'Analytics')]
    const provenance: AuthoringProvenance = {
      kind: 'ai_generated',
      element_provenance: { analytics: { confidence: 'high' } },
    }
    const resolved = makeResolved({
      categories: cats,
      snapshotElements: snap,
      suggestedElements: sug,
      placements: [makePlacement('cloud_storage'), makePlacement('analytics')],
      provenance,
    })

    const sections = buildResolvedSections(resolved, 'en')
    const html = await renderDatachainDocument(sections, { locale: 'en' })
    expect(html).toContain('Cloud storage')
    expect(html).toContain('Analytics')
  })

  it('preserves the placement order within a single category', () => {
    const cat = makeCategory('storage', 'Storage')
    const e1 = makeElement('e1', 'storage', 'First')
    const e2 = makeElement('e2', 'storage', 'Second')
    const resolved = makeResolved({
      categories: [cat],
      snapshotElements: [e1, e2],
      placements: [makePlacement('e2'), makePlacement('e1')],
    })

    const sections = buildResolvedSections(resolved, 'en')
    expect(sections[0]?.elements.map((e) => e.title)).toEqual(['Second', 'First'])
  })
})

describe('ElementDisplay type extension (U7)', () => {
  // Type-level smoke: `proposed` and `provenance` are optional and
  // accept the expected values. If the type extension regresses, this
  // test fails to compile.
  it('accepts proposed and per-element provenance fields without runtime impact on deriveElementDisplay', () => {
    const provenance: import('./types.js').ElementDisplayProvenance = {
      kind: 'ai_generated',
      rationale: 'because reasons',
      confidence: 'high',
      source_references: [{ quote: 'evidence', context: '§1' }],
    }
    // Hand-built ElementDisplay with the new fields populated.
    const display: import('./types.js').ElementDisplay = {
      title: 't',
      description: 'd',
      icon: { url: '/x', alt: 't' },
      variables: [],
      citation: '',
      proposed: true,
      provenance,
    }
    expect(display.proposed).toBe(true)
    expect(display.provenance?.confidence).toBe('high')
  })
})
