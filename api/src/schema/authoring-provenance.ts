import { z } from 'zod'

/**
 * Authoring provenance schemas — extracted from
 * `datachain-instance-resolved.ts` so the optional field can hang off
 * the base `DatachainInstance` without a circular import.
 *
 * `authoring_provenance` is allowed on both wire forms; the resolved
 * form just inherits the same optional field. `suggested_elements` and
 * `schema_snapshot` remain resolved-only — R13/R14 keep that split.
 */

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
 * for one element pick. Stored on
 * `AuthoringProvenance.element_provenance`.
 *
 * Keyed by either an `InstanceElement.element_instance_id` (preferred,
 * required when the same `element_id` is placed multiple times) or by
 * `InstanceElement.element_id` (only when that element_id is placed
 * exactly once and the placement does not carry an
 * `element_instance_id`). The semantic validator
 * (`checkElementProvenanceKeys`) enforces this.
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
 * `DatachainInstance` (and, by inheritance, a `ResolvedDatachainInstance`).
 * Discriminated by `kind` so consumers can switch on a single literal
 * field.
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
 * kind === 'ai_generated'`) lives on `ResolvedDatachainInstanceSchema`
 * as a `.refine(...)` and is mirrored on the wire path by
 * `checkProvenanceRequired`. The thin `DatachainInstance` never
 * carries `suggested_elements`, so R14 does not apply there — the
 * field is simply optional.
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
            'Per-element AI proposal context. Keys are either an ' +
              '`InstanceElement.element_instance_id` (preferred; required when the ' +
              'same element_id is placed multiple times) or an ' +
              '`InstanceElement.element_id` (only valid when that element_id is ' +
              'placed exactly once and the placement carries no ' +
              '`element_instance_id`). Each entry carries rationale, confidence, ' +
              'source quotes, and variable rationales for one element pick.',
          ),
        model: z
          .string()
          .optional()
          .describe('Optional model identifier (e.g. "claude-opus-4-7") — reviewer metadata'),
        generated_at: z
          .string()
          .datetime()
          .optional()
          .describe('Optional ISO 8601 timestamp at which the proposal was generated'),
      })
      .describe('AI-assisted authoring with per-element rationale and optional model metadata'),
  ])
  .describe('Authoring provenance for a DatachainInstance — discriminated by `kind`')

export type AuthoringProvenance = z.infer<typeof AuthoringProvenanceSchema>
