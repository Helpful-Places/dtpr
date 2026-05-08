import { describe, it, expect } from 'vitest'
import {
  ResolvedDatachainInstanceSchema,
  type ResolvedDatachainInstance,
} from '../../src/schema/datachain-instance-resolved.ts'
import {
  validateResolvedInstance,
  type LoadCanonicalSchema,
} from '../../src/validator/index.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'
import type { Element } from '../../src/schema/element.ts'
import type { Category } from '../../src/schema/category.ts'
import type { DatachainType } from '../../src/schema/datachain-type.ts'

// ---------------- fixture helpers ----------------

const loc = (locale: LocaleCode, value: string): LocaleValue => ({ locale, value })

function baseDatachainType(): DatachainType {
  return {
    id: 'ai',
    name: [loc('en', 'AI / Algorithm')],
    description: [],
    categories: ['ai__decision'],
    subchains: [],
    locales: ['en'],
    sources: [],
  }
}

function baseCategory(): Category {
  return {
    id: 'ai__decision',
    name: [loc('en', 'Decision Type')],
    description: [loc('en', 'Type of decision.')],
    prompt: [],
    authoring_guidance: [],
    examples: [],
    sources: [],
    required: true,
    order: 1,
    datachain_type: 'ai',
    shape: 'hexagon',
    element_variables: [],
  }
}

function baseElement(id: string = 'accept_deny'): Element {
  return {
    id,
    category_id: 'ai__decision',
    title: [loc('en', 'Accept or deny')],
    description: [loc('en', 'Binary yes/no decision.')],
    citation: [],
    authoring_guidance: [],
    examples: [],
    sources: [],
    symbol_id: 'accept_deny',
    variables: [],
  }
}

/**
 * Build a parsed canonical ResolvedDatachainInstance for the happy path. The
 * returned value is the *typed* shape (post-parse), so semantic-rule
 * tests don't redundantly verify Zod again.
 */
function baseResolved(overrides: Partial<ResolvedDatachainInstance> = {}): ResolvedDatachainInstance {
  const wire = {
    id: 'worcester-lpr',
    schema_version: 'ai@2026-04-16-beta',
    created_at: '2026-04-16T00:00:00.000Z',
    elements: [{ element_id: 'accept_deny' }],
    schema_snapshot: {
      datachain_type: baseDatachainType(),
      categories: [baseCategory()],
      elements: [baseElement('accept_deny')],
    },
  }
  return { ...ResolvedDatachainInstanceSchema.parse(wire), ...overrides }
}

// ---------------- tests ----------------

describe('validateResolvedInstance — happy paths', () => {
  it('returns ok for a well-formed resolved with empty suggested', async () => {
    const r = await validateResolvedInstance(baseResolved())
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('returns ok when suggested_elements + ai_generated provenance + placement points at a suggested id', async () => {
    const dt = baseDatachainType()
    const cat = baseCategory()
    const wire = {
      id: 'worcester-lpr',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      // Placement references the AI-suggested element.
      elements: [{ element_id: 'novel_decision' }],
      schema_snapshot: {
        datachain_type: dt,
        categories: [cat],
        elements: [], // none — the element pool is suggested-only.
      },
      suggested_elements: [
        {
          ...baseElement('novel_decision'),
          title: [loc('en', 'Novel decision shape')],
        },
      ],
      authoring_provenance: {
        kind: 'ai_generated',
        element_provenance: {
          novel_decision: { confidence: 'high', rationale: 'Document calls this out explicitly.' },
        },
      },
    }
    const resolved = ResolvedDatachainInstanceSchema.parse(wire)
    const r = await validateResolvedInstance(resolved)
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('skips snapshot consistency when loader returns null (R9 graceful degradation)', async () => {
    // Stub: pinned version is not in INDEX_KEY.
    const load: LoadCanonicalSchema = () => null
    const r = await validateResolvedInstance(baseResolved(), { loadCanonicalSchema: load })
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('passes snapshot consistency when canonical matches the pinned snapshot', async () => {
    const dt = baseDatachainType()
    const cat = baseCategory()
    const el = baseElement('accept_deny')
    const wire = {
      id: 'worcester-lpr',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny' }],
      schema_snapshot: { datachain_type: dt, categories: [cat], elements: [el] },
    }
    const resolved = ResolvedDatachainInstanceSchema.parse(wire)
    const load: LoadCanonicalSchema = () => ({
      datachainType: dt,
      categories: [cat],
      elements: [el],
    })
    const r = await validateResolvedInstance(resolved, { loadCanonicalSchema: load })
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })
})

describe('validateResolvedInstance — error paths', () => {
  it('emits unknown_element_id when a placement ref is absent from both pools', async () => {
    const wire = {
      id: 'x',
      title: [],
      description: [],
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      // Placement references something the snapshot satisfies for
      // required categories, plus an extra unknown id.
      elements: [{ element_id: 'accept_deny' }, { element_id: 'phantom_id' }],
      schema_snapshot: {
        datachain_type: baseDatachainType(),
        categories: [baseCategory()],
        elements: [baseElement('accept_deny')],
      },
    }
    const resolved = ResolvedDatachainInstanceSchema.parse(wire)
    const r = await validateResolvedInstance(resolved)
    expect(r.ok).toBe(false)
    const err = r.errors.find((e) => e.code === 'unknown_element_id')
    expect(err).toBeDefined()
    expect(err!.path).toBe('elements[1].element_id')
    expect(err!.message).toContain('phantom_id')
  })

  it('emits provenance_required when suggested non-empty + provenance kind is human', async () => {
    // Bypass Zod (which would reject) by constructing the typed value
    // directly — this tests the wire-path enforcement that backs JSON
    // Schema callers who skip the Zod refinement.
    const resolved: ResolvedDatachainInstance = {
      id: 'x',
      title: [],
      description: [],
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny', priority: 0, variables: [], actions: [], sources: [] }],
      subchain_instances: [],
      sources: [],
      linked_instance_ids: [],
      schema_snapshot: {
        datachain_type: baseDatachainType(),
        categories: [baseCategory()],
        elements: [baseElement('accept_deny')],
      },
      suggested_elements: [{ ...baseElement('novel_decision') }],
      authoring_provenance: { kind: 'human' },
    }
    const r = await validateResolvedInstance(resolved)
    expect(r.ok).toBe(false)
    const err = r.errors.find((e) => e.code === 'provenance_required')
    expect(err).toBeDefined()
    expect(err!.path).toBe('authoring_provenance')
  })

  it('emits provenance_required when suggested non-empty + provenance is undefined', async () => {
    const resolved: ResolvedDatachainInstance = {
      id: 'x',
      title: [],
      description: [],
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny', priority: 0, variables: [], actions: [], sources: [] }],
      subchain_instances: [],
      sources: [],
      linked_instance_ids: [],
      schema_snapshot: {
        datachain_type: baseDatachainType(),
        categories: [baseCategory()],
        elements: [baseElement('accept_deny')],
      },
      suggested_elements: [{ ...baseElement('novel_decision') }],
      // authoring_provenance intentionally omitted
    }
    const r = await validateResolvedInstance(resolved)
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.code === 'provenance_required')).toBe(true)
  })

  it('emits element_id_collision when suggested id matches a snapshot id (defensive, bypassing Zod)', async () => {
    // Construct typed value directly so the Zod R15a refinement isn't
    // exercised here — this is the defensive duplicate the wire
    // validator carries.
    const collidingId = 'accept_deny'
    const resolved: ResolvedDatachainInstance = {
      id: 'x',
      title: [],
      description: [],
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: collidingId, priority: 0, variables: [], actions: [], sources: [] }],
      subchain_instances: [],
      sources: [],
      linked_instance_ids: [],
      schema_snapshot: {
        datachain_type: baseDatachainType(),
        categories: [baseCategory()],
        elements: [baseElement(collidingId)],
      },
      suggested_elements: [
        { ...baseElement(collidingId), title: [loc('en', 'duplicate')] },
      ],
      authoring_provenance: { kind: 'ai_generated' },
    }
    const r = await validateResolvedInstance(resolved)
    expect(r.ok).toBe(false)
    const err = r.errors.find((e) => e.code === 'element_id_collision')
    expect(err).toBeDefined()
    expect(err!.path).toBe('suggested_elements[0].id')
    expect(err!.message).toContain(collidingId)
  })

  it('emits snapshot_drift when a category title differs from the live store', async () => {
    const dt = baseDatachainType()
    const liveCategory = baseCategory()
    const driftedCategory: Category = {
      ...baseCategory(),
      // Title drift: snapshot has an old title, live store has the
      // canonical one.
      name: [loc('en', 'Decision Type — old')],
    }
    const wire = {
      id: 'x',
      title: [],
      description: [],
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny' }],
      schema_snapshot: {
        datachain_type: dt,
        categories: [driftedCategory],
        elements: [baseElement('accept_deny')],
      },
    }
    const resolved = ResolvedDatachainInstanceSchema.parse(wire)
    const load: LoadCanonicalSchema = () => ({
      datachainType: dt,
      categories: [liveCategory],
      elements: [baseElement('accept_deny')],
    })
    const r = await validateResolvedInstance(resolved, { loadCanonicalSchema: load })
    expect(r.ok).toBe(false)
    const err = r.errors.find((e) => e.code === 'snapshot_drift')
    expect(err).toBeDefined()
    expect(err!.path).toBe('schema_snapshot.categories')
  })

  it('emits REQUIRED_CATEGORY_MISSING when a required category has no placement', async () => {
    // Snapshot has a required category 'ai__decision' but the
    // datachain places no element in it. Compose a non-required
    // category we can place into.
    const optionalCategory: Category = {
      ...baseCategory(),
      id: 'ai__notes',
      required: false,
      order: 2,
    }
    const requiredCategory = baseCategory() // required: true
    const optionalElement: Element = {
      ...baseElement('free_text_note'),
      category_id: 'ai__notes',
    }
    const wire = {
      id: 'x',
      title: [],
      description: [],
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      // Placement only covers the optional category; required category
      // is uncovered.
      elements: [{ element_id: 'free_text_note' }],
      schema_snapshot: {
        datachain_type: { ...baseDatachainType(), categories: ['ai__decision', 'ai__notes'] },
        categories: [requiredCategory, optionalCategory],
        elements: [baseElement('accept_deny'), optionalElement],
      },
    }
    const resolved = ResolvedDatachainInstanceSchema.parse(wire)
    const r = await validateResolvedInstance(resolved)
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.code === 'REQUIRED_CATEGORY_MISSING')).toBe(true)
  })

  it('integration: round-trip Zod parse + validateResolvedInstance returns ok for canonical fixture', async () => {
    const wire = {
      id: 'worcester-lpr',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny' }],
      schema_snapshot: {
        datachain_type: baseDatachainType(),
        categories: [baseCategory()],
        elements: [baseElement('accept_deny')],
      },
    }
    const parsed = ResolvedDatachainInstanceSchema.parse(wire)
    const r = await validateResolvedInstance(parsed)
    expect(r.ok).toBe(true)
  })
})
