import { z } from 'zod'

/**
 * Kind of source backing a provenance reference. Used at every layer
 * that points outward at a citable artifact:
 *
 *   - At the **instance** level: the AI register row, model card, or
 *     policy document a deployment derives its disclosure from.
 *   - At the **schema definition** level (datachain type, category,
 *     element): the framework, standard, regulation, or research the
 *     definition was developed against.
 *
 * The enum is intentionally widened beyond the original instance-only
 * set (`ai_register`, `model_card`, `policy_document`,
 * `api_documentation`, `other`) to also cover schema-design
 * provenance (`framework`, `standard`, `regulation`, `research_paper`,
 * `prior_art`, `internal_memo`). Adding new enum values is
 * non-breaking for stored data — existing references still parse.
 */
export const ProvenanceTypeSchema = z
  .enum([
    'ai_register',
    'model_card',
    'policy_document',
    'api_documentation',
    'framework',
    'standard',
    'regulation',
    'research_paper',
    'prior_art',
    'internal_memo',
    'other',
  ])
  .describe('Provenance reference kind')

export type ProvenanceType = z.infer<typeof ProvenanceTypeSchema>

/**
 * Shared provenance-reference shape. One row points at one external
 * artifact (paper, register entry, framework section). The shape is
 * deliberately small — the goal is "where did this come from?" not a
 * full bibliographic record.
 *
 * Reused on:
 *   - DatachainInstance.sources                  (whole-disclosure scope)
 *   - DatachainInstance.elements[].sources       (per-element scope)
 *   - DatachainType.sources                      (schema-definition scope)
 *   - Category.sources                           (schema-definition scope)
 *   - Element.sources                            (schema-definition scope)
 */
export const ProvenanceRefSchema = z
  .object({
    type: ProvenanceTypeSchema,
    title: z.string().min(1).describe('Human-readable source title'),
    url: z.string().url().optional().describe('Optional URL to the source artifact'),
    citation: z.string().optional().describe('Optional citation/footnote text'),
  })
  .describe('Provenance reference — points at one external source')

export type ProvenanceRef = z.infer<typeof ProvenanceRefSchema>
