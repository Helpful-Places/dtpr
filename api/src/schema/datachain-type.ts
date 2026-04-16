import { z } from 'zod'
import { LocaleValueArraySchema, LocaleCodeSchema } from './locale.ts'

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
    locales: z
      .array(LocaleCodeSchema)
      .min(1)
      .describe('Allow-list of locale codes supported by this datachain type (rule 11)'),
  })
  .describe('Top-level datachain type definition')

export type DatachainType = z.infer<typeof DatachainTypeSchema>
