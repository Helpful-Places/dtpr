import { z } from 'zod'
import { CategorySchema } from './category.ts'
import { DatachainTypeSchema } from './datachain-type.ts'
import { DatachainInstanceSchema } from './datachain-instance.ts'
import { ElementSchema } from './element.ts'

/**
 * Authoring provenance — describes who/what produced a
 * `ResolvedDatachain` and (when AI-assisted) the rationale and
 * source references that justify the proposal. Discriminated by
 * `kind` so consumers can switch on a single literal field.
 *
 * Two shapes:
 *
 *   - `'human'`: marker only. The disclosure was authored by a
 *     person; no model rationale is recorded. Equivalent to omitting
 *     `authoring_provenance` for parse purposes (R14 only fires on
 *     `'ai_generated'`); kept as an explicit signal for downstream
 *     UI.
 *   - `'ai_generated'`: every candidate field optional per the plan's
 *     Scope Boundaries. `confidence` is clamped to [0, 1].
 *     `source_references` are URL strings restricted to `https:` /
 *     `http:` schemes (no `ftp:`, `javascript:`, `data:`) — defended
 *     at the schema layer so a malformed proposal cannot smuggle
 *     unsafe URIs into the wire shape.
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
        rationale: z
          .string()
          .optional()
          .describe('Free-text rationale explaining why the model proposed these elements'),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe('Overall confidence score in [0, 1] (renderer buckets to low/medium/high)'),
        source_references: z
          .array(
            z
              .string()
              .url()
              .refine(
                (s) => {
                  try {
                    const u = new URL(s)
                    return u.protocol === 'https:' || u.protocol === 'http:'
                  } catch {
                    return false
                  }
                },
                {
                  message: 'source_references must use https: or http: scheme',
                },
              ),
          )
          .optional()
          .describe(
            'Optional list of source URLs the model cited (constrained to https:/http: schemes — no ftp:/javascript:/data: smuggling).',
          ),
        variable_rationale: z
          .record(z.string(), z.string())
          .optional()
          .describe('Optional per-variable rationale map keyed by variable id'),
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
      .describe('AI-assisted authoring with optional rationale, confidence, and source citations'),
  ])
  .describe('Authoring provenance for a ResolvedDatachain — discriminated by `kind`')

export type AuthoringProvenance = z.infer<typeof AuthoringProvenanceSchema>

/**
 * Schema snapshot — the slice of schema content (datachain type,
 * categories, elements) frozen onto a `ResolvedDatachain` at
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
  .describe('Frozen slice of schema content pinned onto a ResolvedDatachain')

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
export const ResolvedDatachainSchema = DatachainInstanceSchema.extend({
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

export type ResolvedDatachain = z.infer<typeof ResolvedDatachainSchema>
