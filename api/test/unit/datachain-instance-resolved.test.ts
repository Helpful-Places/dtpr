import { describe, it, expect } from 'vitest'
import {
  AuthoringProvenanceSchema,
  DatachainInstanceSchema,
  ResolvedDatachainSchema,
  SchemaSnapshotSchema,
} from '../../src/schema/index.ts'
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

function baseResolvedInput() {
  // Use the parse output of baseInstance as the wire input for resolved.
  // We pass a pre-parse literal (with required fields populated; defaults
  // can stay omitted since DatachainInstanceSchema fills them).
  return {
    id: 'worcester-lpr',
    schema_version: 'ai@2026-04-16-beta',
    created_at: '2026-04-16T00:00:00.000Z',
    elements: [
      {
        element_id: 'accept_deny',
      },
    ],
    schema_snapshot: {
      datachain_type: baseDatachainType(),
      categories: [baseCategory()],
      elements: [baseElement('accept_deny')],
    },
  }
}

// ---------------- AuthoringProvenanceSchema ----------------

describe('AuthoringProvenanceSchema', () => {
  it('parses a human marker', () => {
    const r = AuthoringProvenanceSchema.parse({ kind: 'human' })
    expect(r.kind).toBe('human')
  })

  it('parses an ai_generated marker with no fields', () => {
    const r = AuthoringProvenanceSchema.parse({ kind: 'ai_generated' })
    expect(r.kind).toBe('ai_generated')
  })

  it('parses ai_generated with model + generated_at + element_provenance map', () => {
    const r = AuthoringProvenanceSchema.parse({
      kind: 'ai_generated',
      model: 'claude-sonnet-4-6',
      generated_at: '2026-05-07T00:00:00.000Z',
      element_provenance: {
        accept_deny: {
          rationale: 'Document explicitly mentions a binary decision.',
          confidence: 'high',
          source_references: [
            { quote: 'either accept or deny the application', context: 'Operations §3' },
            { quote: 'no human review of the result' },
          ],
          variable_rationale: { retention_period: '90 days specified in the same paragraph' },
        },
      },
    })
    expect(r.kind).toBe('ai_generated')
    if (r.kind !== 'ai_generated') throw new Error('discriminator')
    expect(r.model).toBe('claude-sonnet-4-6')
    expect(r.element_provenance?.accept_deny?.confidence).toBe('high')
    expect(r.element_provenance?.accept_deny?.source_references).toHaveLength(2)
    expect(r.element_provenance?.accept_deny?.source_references?.[0]?.quote).toBe(
      'either accept or deny the application',
    )
  })

  it('parses ai_generated with sparse element_provenance entries (rationale only / confidence only)', () => {
    const r = AuthoringProvenanceSchema.parse({
      kind: 'ai_generated',
      element_provenance: {
        a: { rationale: 'just rationale' },
        b: { confidence: 'low' },
        c: {}, // empty entry — still valid (marker-only for an element pick)
      },
    })
    if (r.kind !== 'ai_generated') throw new Error('discriminator')
    expect(r.element_provenance?.a?.rationale).toBe('just rationale')
    expect(r.element_provenance?.b?.confidence).toBe('low')
    expect(r.element_provenance?.c).toEqual({})
  })

  it('rejects an unknown kind', () => {
    const r = AuthoringProvenanceSchema.safeParse({ kind: 'robot' })
    expect(r.success).toBe(false)
  })

  it('rejects confidence values outside the high/medium/low enum', () => {
    for (const bad of [0.5, 'super-high', 'unknown', null]) {
      const r = AuthoringProvenanceSchema.safeParse({
        kind: 'ai_generated',
        element_provenance: { a: { confidence: bad as unknown as 'high' } },
      })
      expect(r.success, `expected reject for confidence=${String(bad)}`).toBe(false)
    }
  })

  it('rejects source_references entries missing a quote', () => {
    const r = AuthoringProvenanceSchema.safeParse({
      kind: 'ai_generated',
      element_provenance: {
        a: { source_references: [{ context: 'no quote here' } as unknown as { quote: string }] },
      },
    })
    expect(r.success).toBe(false)
  })

  it('rejects source_references entries with empty-string quotes', () => {
    const r = AuthoringProvenanceSchema.safeParse({
      kind: 'ai_generated',
      element_provenance: { a: { source_references: [{ quote: '' }] } },
    })
    expect(r.success).toBe(false)
  })

  it('rejects malformed generated_at', () => {
    const r = AuthoringProvenanceSchema.safeParse({
      kind: 'ai_generated',
      generated_at: 'not-a-date',
    })
    expect(r.success).toBe(false)
  })

  it('strips legacy datachain-level rationale / confidence / source_references / variable_rationale (moved to per-element)', () => {
    // The old datachain-level fields are no longer part of the schema.
    // Zod's default `strip` behavior silently drops them — the parsed
    // value never carries them. Authors who still emit the old shape
    // get a clean parse but lose their data; the breaking change is
    // documented at the schema-comment level.
    const r = AuthoringProvenanceSchema.parse({
      kind: 'ai_generated',
      rationale: 'whole-disclosure',
      confidence: 0.7,
      source_references: ['https://example.com'],
      variable_rationale: { x: 'y' },
    })
    if (r.kind !== 'ai_generated') throw new Error('discriminator')
    expect((r as Record<string, unknown>).rationale).toBeUndefined()
    expect((r as Record<string, unknown>).confidence).toBeUndefined()
    expect((r as Record<string, unknown>).source_references).toBeUndefined()
    expect((r as Record<string, unknown>).variable_rationale).toBeUndefined()
  })
})

// ---------------- SchemaSnapshotSchema ----------------

describe('SchemaSnapshotSchema', () => {
  it('parses a minimal snapshot', () => {
    const r = SchemaSnapshotSchema.parse({
      datachain_type: baseDatachainType(),
      categories: [baseCategory()],
      elements: [baseElement()],
    })
    expect(r.elements).toHaveLength(1)
    expect(r.categories).toHaveLength(1)
  })
})

// ---------------- ResolvedDatachainSchema ----------------

describe('ResolvedDatachainSchema', () => {
  it('strict superset: thin DatachainInstance literal rejects (missing schema_snapshot)', () => {
    const thin = {
      id: 'worcester-lpr',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny' }],
    }
    // Thin parse succeeds against DatachainInstanceSchema...
    expect(DatachainInstanceSchema.safeParse(thin).success).toBe(true)
    // ...but the same literal fails ResolvedDatachainSchema.
    const r = ResolvedDatachainSchema.safeParse(thin)
    expect(r.success).toBe(false)
  })

  it('happy path: parses with schema_snapshot, no suggested_elements, no provenance', () => {
    const r = ResolvedDatachainSchema.parse(baseResolvedInput())
    expect(r.suggested_elements).toEqual([])
    expect(r.authoring_provenance).toBeUndefined()
  })

  it('happy path: parses with non-empty suggested + ai_generated provenance', () => {
    const input = {
      ...baseResolvedInput(),
      suggested_elements: [baseElement('proposed_element')],
      authoring_provenance: {
        kind: 'ai_generated' as const,
        element_provenance: { proposed_element: { confidence: 'high' as const } },
      },
    }
    const r = ResolvedDatachainSchema.parse(input)
    expect(r.suggested_elements).toHaveLength(1)
    expect(r.authoring_provenance?.kind).toBe('ai_generated')
  })

  it('happy path: empty suggested with human provenance succeeds (R14 implication, not biconditional)', () => {
    const input = {
      ...baseResolvedInput(),
      authoring_provenance: { kind: 'human' as const },
    }
    const r = ResolvedDatachainSchema.parse(input)
    expect(r.authoring_provenance?.kind).toBe('human')
    expect(r.suggested_elements).toEqual([])
  })

  it('happy path: empty suggested with ai_generated provenance succeeds (R14 antecedent false)', () => {
    const input = {
      ...baseResolvedInput(),
      authoring_provenance: { kind: 'ai_generated' as const },
    }
    const r = ResolvedDatachainSchema.parse(input)
    expect(r.authoring_provenance?.kind).toBe('ai_generated')
  })

  it('R14 reject: non-empty suggested + human provenance', () => {
    const input = {
      ...baseResolvedInput(),
      suggested_elements: [baseElement('proposed_element')],
      authoring_provenance: { kind: 'human' as const },
    }
    const r = ResolvedDatachainSchema.safeParse(input)
    expect(r.success).toBe(false)
    if (!r.success) {
      const hasR14 = r.error.issues.some((i) =>
        (i.message ?? '').includes('R14'),
      )
      expect(hasR14).toBe(true)
    }
  })

  it('R14 reject: non-empty suggested + undefined provenance', () => {
    const input = {
      ...baseResolvedInput(),
      suggested_elements: [baseElement('proposed_element')],
    }
    const r = ResolvedDatachainSchema.safeParse(input)
    expect(r.success).toBe(false)
  })

  it('R15a reject: id collision between schema_snapshot.elements and suggested_elements', () => {
    const input = {
      ...baseResolvedInput(),
      // 'accept_deny' is already in schema_snapshot.elements per baseResolvedInput
      suggested_elements: [baseElement('accept_deny')],
      authoring_provenance: { kind: 'ai_generated' as const },
    }
    const r = ResolvedDatachainSchema.safeParse(input)
    expect(r.success).toBe(false)
    if (!r.success) {
      const hasR15a = r.error.issues.some(
        (i) =>
          (i.message ?? '').includes('R15a') ||
          (i.path?.[0] === 'suggested_elements' && (i.message ?? '').includes('id')),
      )
      expect(hasR15a).toBe(true)
    }
  })

  it('round-trip equivalence (R3, R4): strip 3 new fields → parses as thin with same shape', () => {
    const resolved = ResolvedDatachainSchema.parse({
      ...baseResolvedInput(),
      suggested_elements: [baseElement('proposed')],
      authoring_provenance: {
        kind: 'ai_generated' as const,
        element_provenance: { proposed: { confidence: 'medium' as const } },
      },
    })
    // Strip the three resolved-only fields.
    const { schema_snapshot: _ss, suggested_elements: _se, authoring_provenance: _ap, ...stripped } =
      resolved
    void _ss
    void _se
    void _ap

    const thinFromResolved = DatachainInstanceSchema.parse(stripped)
    const thinDirect = DatachainInstanceSchema.parse({
      id: 'worcester-lpr',
      schema_version: 'ai@2026-04-16-beta',
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny' }],
    })
    expect(thinFromResolved).toEqual(thinDirect)
  })

  // Instance-level title + description (the system being described).
  // Optional with `default([])` so existing v2 fixtures parse unchanged.
  describe('instance title + description', () => {
    it('elided title + description default to empty arrays (back-compat)', () => {
      const parsed = DatachainInstanceSchema.parse({
        id: 'worcester-lpr',
        schema_version: 'ai@2026-04-16-beta',
        created_at: '2026-04-16T00:00:00.000Z',
        elements: [{ element_id: 'accept_deny' }],
      })
      expect(parsed.title).toEqual([])
      expect(parsed.description).toEqual([])
    })

    it('parses title + description as LocaleValueArray on both wire forms', () => {
      const wire = {
        id: 'worcester-lpr',
        title: [loc('en', 'Worcester license plate reader')],
        description: [loc('en', 'Parking enforcement automation.')],
        schema_version: 'ai@2026-04-16-beta',
        created_at: '2026-04-16T00:00:00.000Z',
        elements: [{ element_id: 'accept_deny' }],
      }
      const thin = DatachainInstanceSchema.parse(wire)
      expect(thin.title.map((t) => t.value)).toEqual(['Worcester license plate reader'])
      expect(thin.description.map((d) => d.value)).toEqual(['Parking enforcement automation.'])

      const resolved = ResolvedDatachainSchema.parse({
        ...wire,
        schema_snapshot: {
          datachain_type: baseDatachainType(),
          categories: [baseCategory()],
          elements: [baseElement('accept_deny')],
        },
      })
      expect(resolved.title).toEqual(thin.title)
      expect(resolved.description).toEqual(thin.description)
    })

    it('round-trip preserves title + description', () => {
      const wire = {
        id: 'worcester-lpr',
        title: [loc('en', 'Worcester license plate reader')],
        description: [loc('en', 'A summary.')],
        schema_version: 'ai@2026-04-16-beta',
        created_at: '2026-04-16T00:00:00.000Z',
        elements: [{ element_id: 'accept_deny' }],
        schema_snapshot: {
          datachain_type: baseDatachainType(),
          categories: [baseCategory()],
          elements: [baseElement('accept_deny')],
        },
      }
      const resolved = ResolvedDatachainSchema.parse(wire)
      const { schema_snapshot: _ss, suggested_elements: _se, authoring_provenance: _ap, ...stripped } =
        resolved
      void _ss
      void _se
      void _ap
      const thin = DatachainInstanceSchema.parse(stripped)
      expect(thin.title).toEqual(resolved.title)
      expect(thin.description).toEqual(resolved.description)
    })
  })
})
