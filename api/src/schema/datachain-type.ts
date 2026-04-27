import { z } from 'zod'
import { LocaleValueArraySchema, LocaleCodeSchema } from './locale.ts'

/**
 * A subchain definition: a named, ordered grouping of categories within
 * a datachain type. Initial use case in `ai` is `data_flow = [input_dataset,
 * processing, output_dataset]`. Categories may belong to multiple
 * subchains (no exclusivity constraint).
 */
export const SubchainSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe('Subchain id, unique within the datachain type'),
    name: LocaleValueArraySchema.describe('Localized display name'),
    categories: z
      .array(z.string().min(1))
      .min(1)
      .describe(
        'Ordered list of category ids that participate in this subchain. Categories may also appear in other subchains.',
      ),
  })
  .describe('Named, ordered grouping of categories declared on a datachain type')

export type Subchain = z.infer<typeof SubchainSchema>

/**
 * A datachain type — a top-level grouping (e.g. `ai`, `device`). At
 * P1 we only port `ai`; `device` stays on the legacy Nuxt surface.
 * The ordered `categories` list determines display order and is
 * validated for integrity by semantic rule #17.
 */
export const DatachainTypeSchema = z
  .object({
    id: z.string().min(1).describe('Datachain type id, e.g. "ai"'),
    name: LocaleValueArraySchema,
    description: LocaleValueArraySchema.default([]),
    categories: z
      .array(z.string().min(1))
      .min(1)
      .describe('Ordered list of category ids. Must reference defined categories (rule 17).'),
    subchains: z
      .array(SubchainSchema)
      .default([])
      .describe(
        'Optional ordered subchain definitions. Each entry names a subset of categories that compose a logical flow (e.g. `data_flow`).',
      ),
    locales: z
      .array(LocaleCodeSchema)
      .min(1)
      .describe('Allow-list of locale codes supported by this datachain type (rule 11)'),
  })
  .describe('Top-level datachain type definition')

export type DatachainType = z.infer<typeof DatachainTypeSchema>
