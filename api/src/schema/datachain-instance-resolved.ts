import { z } from 'zod'
import { CategorySchema } from './category.ts'
import { DatachainTypeSchema } from './datachain-type.ts'
import { DatachainInstanceSchema } from './datachain-instance.ts'
import { ElementSchema } from './element.ts'

// Authoring-provenance schemas now live under their own module so the
// optional field can hang off the base `DatachainInstance` without
// inducing a circular import. Re-export the public surface here so
// existing consumers continue to import these names from
// `datachain-instance-resolved.ts`.
export {
  AuthoringProvenanceSchema,
  ConfidenceLevelSchema,
  ElementProvenanceSchema,
  SourceReferenceSchema,
  type AuthoringProvenance,
  type ConfidenceLevel,
  type ElementProvenance,
  type SourceReference,
} from './authoring-provenance.ts'

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
 *
 * `authoring_provenance` is inherited from `DatachainInstance` — it
 * is allowed on both wire forms. R14 implication, not biconditional —
 * a human-authored disclosure may carry no provenance, and an
 * AI-authored disclosure with no suggestions may still mark itself
 * `ai_generated`.
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
})
  .describe(
    'A resolved datachain — strict superset of DatachainInstance with pinned schema snapshot and optional AI-suggested elements. `authoring_provenance` is inherited from DatachainInstance.',
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
