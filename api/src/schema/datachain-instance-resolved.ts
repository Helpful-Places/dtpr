import { z } from 'zod'
import { CategorySchema } from './category.ts'
import { DatachainTypeSchema } from './datachain-type.ts'
import { DatachainInstanceSchema } from './datachain-instance.ts'
import { ElementSchema } from './element.ts'

/**
 * Qualitative confidence level for a per-element AI proposal.
 * Matches the canonical Ruby generator (`hp-app` `DatachainGenerator`)
 * which has Claude emit one of three buckets per element pick.
 */
export const ConfidenceLevelSchema = z
  .enum(['high', 'medium', 'low'])
  .describe('Qualitative confidence bucket for an AI-proposed element pick')

export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>

/**
 * A single piece of evidence the model cited to justify an element
 * pick. `quote` is verbatim text lifted from the source document
 * (e.g. an AI register entry, model card row, policy doc paragraph).
 * `context` is an optional locator — section heading, page number,
 * row id — that helps a reviewer find where the quote came from.
 *
 * Free-text by design: the renderer escapes via Vue's `{{ }}`
 * interpolation. Never `v-html` these fields.
 */
export const SourceReferenceSchema = z
  .object({
    quote: z
      .string()
      .min(1)
      .describe('Verbatim quote from the source document supporting this element pick'),
    context: z
      .string()
      .optional()
      .describe('Optional locator (section, page, row id) for the quote'),
  })
  .describe('A single quoted source reference cited by an AI proposal for one element')

export type SourceReference = z.infer<typeof SourceReferenceSchema>

/**
 * Per-element AI proposal context — the rationale, confidence,
 * cited evidence, and per-variable explanations the model produced
 * for one element pick. Keyed by `element_id` on
 * `AuthoringProvenance.element_provenance`.
 *
 * Every field is optional: the model may emit a sparse entry (e.g.
 * just confidence + rationale, no quotes) and the renderer hides
 * empty subsections. Empty entries are still meaningful as a marker
 * that this element pick was AI-authored.
 */
export const ElementProvenanceSchema = z
  .object({
    rationale: z
      .string()
      .optional()
      .describe('1–2 sentence explanation of why the model picked this specific element'),
    confidence: ConfidenceLevelSchema.optional().describe(
      'Qualitative confidence bucket for this element pick',
    ),
    source_references: z
      .array(SourceReferenceSchema)
      .optional()
      .describe('Verbatim quotes from input documents supporting this element pick'),
    variable_rationale: z
      .record(z.string(), z.string())
      .optional()
      .describe('Per-variable explanation map keyed by variable id'),
  })
  .describe('Per-element AI proposal context — rationale, confidence, cited quotes, variable notes')

export type ElementProvenance = z.infer<typeof ElementProvenanceSchema>

/**
 * Authoring provenance — describes who/what produced a
 * `ResolvedDatachainInstance`. Discriminated by `kind` so consumers can
 * switch on a single literal field.
 *
 * Two shapes:
 *
 *   - `'human'`: marker only. The disclosure was authored by a
 *     person; no model rationale is recorded.
 *   - `'ai_generated'`: optional whole-disclosure model metadata
 *     (`model`, `generated_at`) plus a per-element rationale map
 *     (`element_provenance`) keyed by `element_id`. Per-element
 *     rationale, confidence, and cited quotes mirror the canonical
 *     Ruby generator's intent (`hp-app` `DatachainGenerator`).
 *
 * R14 implication (`suggested_elements.length > 0 ⟹
 * kind === 'ai_generated'`) lives on `ResolvedDatachainInstanceSchema` as a
 * `.refine(...)` and is mirrored on the wire path by
 * `checkProvenanceRequired`.
 */
export const AuthoringProvenanceSchema = z
  .discriminatedUnion('kind', [
    z
      .object({
        kind: z.literal('human').describe('Human-authored disclosure (marker only)'),
      })
      .describe('Human authoring marker — no rationale recorded'),
    z
      .object({
        kind: z.literal('ai_generated').describe('AI-assisted authoring marker'),
        element_provenance: z
          .record(z.string(), ElementProvenanceSchema)
          .optional()
          .describe(
            'Per-element AI proposal context, keyed by element_id. Each entry carries rationale, confidence, source quotes, and variable rationales for one element pick.',
          ),
        model: z
          .string()
          .optional()
          .describe('Optional model identifier (e.g. "claude-sonnet-4-6") — reviewer metadata'),
        generated_at: z
          .string()
          .datetime()
          .optional()
          .describe('Optional ISO 8601 timestamp at which the proposal was generated'),
      })
      .describe('AI-assisted authoring with per-element rationale and optional model metadata'),
  ])
  .describe('Authoring provenance for a ResolvedDatachainInstance — discriminated by `kind`')

export type AuthoringProvenance = z.infer<typeof AuthoringProvenanceSchema>

/**
 * Schema snapshot — the slice of schema content (datachain type,
 * categories, elements) frozen onto a `ResolvedDatachainInstance` at
 * resolve-time. Pinning this snapshot decouples runtime rendering
 * and validation from the live schema store: a deployed disclosure
 * keeps rendering correctly even if the schema evolves or the live
 * version index drops the pinned version.
 *
 * Shape is the full schema content. The resolver (U3) populates
 * this from the loaded schema-version bundle; consumers do not
 * author it by hand.
 */
export const SchemaSnapshotSchema = z
  .object({
    datachain_type: DatachainTypeSchema.describe(
      'Full datachain-type definition pinned at resolve-time',
    ),
    categories: z
      .array(CategorySchema)
      .describe('Full category definitions pinned at resolve-time'),
    elements: z
      .array(ElementSchema)
      .describe('Full element definitions pinned at resolve-time'),
  })
  .describe('Frozen slice of schema content pinned onto a ResolvedDatachainInstance')

export type SchemaSnapshot = z.infer<typeof SchemaSnapshotSchema>

/**
 * Resolved datachain — strict superset of `DatachainInstance` adding:
 *
 *   - `schema_snapshot`: pinned schema content (R3, R10).
 *   - `suggested_elements`: AI-proposed elements not present in the
 *     pinned snapshot. Default `[]`. R14 enforces that any non-empty
 *     value implies `authoring_provenance.kind === 'ai_generated'`.
 *   - `authoring_provenance`: optional. R14 implication, not
 *     biconditional — a human-authored disclosure may carry no
 *     provenance, and an AI-authored disclosure with no suggestions
 *     may still mark itself `ai_generated`.
 *
 * Refinements:
 *
 *   - **R14**: `suggested_elements.length > 0 ⟹
 *     authoring_provenance?.kind === 'ai_generated'`. The Zod
 *     refinement runs at parse-time. Whether Zod's JSON Schema
 *     emitter reproduces this conditional under
 *     `unrepresentable: 'any'` is asserted empirically in
 *     `api/test/unit/json-schema-emit.test.ts`; if absent, U2's
 *     semantic validator carries runtime enforcement on the wire.
 *   - **R15a**: element-id collision — for every `s ∈
 *     suggested_elements`, no `e ∈ schema_snapshot.elements` has the
 *     same `id`. Snapshot wins on lookup; collisions are rejected at
 *     parse-time so resolution never sees ambiguity.
 */
export const ResolvedDatachainInstanceSchema = DatachainInstanceSchema.extend({
  schema_snapshot: SchemaSnapshotSchema.describe(
    'Frozen schema content (datachain type, categories, elements) pinned at resolve-time. Decouples rendering from the live schema store.',
  ),
  suggested_elements: z
    .array(ElementSchema)
    .default([])
    .describe(
      'AI-proposed elements that are not present in `schema_snapshot.elements`. Non-empty implies `authoring_provenance.kind === "ai_generated"` (R14). Element ids must not collide with `schema_snapshot.elements[].id` (R15a).',
    ),
  authoring_provenance: AuthoringProvenanceSchema.optional().describe(
    'Optional authoring provenance. Required to be `kind: "ai_generated"` when `suggested_elements` is non-empty (R14).',
  ),
})
  .describe(
    'A resolved datachain — strict superset of DatachainInstance with pinned schema snapshot, optional AI-suggested elements, and optional authoring provenance.',
  )
  .refine(
    (val) => {
      // R14: suggested_elements.length > 0 ⟹ authoring_provenance.kind === 'ai_generated'
      if (val.suggested_elements.length === 0) return true
      return val.authoring_provenance?.kind === 'ai_generated'
    },
    {
      message:
        'Non-empty suggested_elements requires authoring_provenance.kind === "ai_generated" (R14)',
      path: ['authoring_provenance'],
    },
  )
  .refine(
    (val) => {
      // R15a: no element id collision between schema_snapshot.elements and suggested_elements
      if (val.suggested_elements.length === 0) return true
      const snapshotIds = new Set(val.schema_snapshot.elements.map((e) => e.id))
      return val.suggested_elements.every((s) => !snapshotIds.has(s.id))
    },
    {
      message:
        'suggested_elements must not share an id with any schema_snapshot.elements entry (R15a)',
      path: ['suggested_elements'],
    },
  )

export type ResolvedDatachainInstance = z.infer<typeof ResolvedDatachainInstanceSchema>
