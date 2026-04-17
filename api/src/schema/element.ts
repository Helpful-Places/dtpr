import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'
import { VariableSchema } from './variable.ts'

/**
 * An element — a reusable tile that can be placed in a category.
 *
 * Two shapes of content to distinguish when reading this file:
 *
 *   - **Structural schema**: the Zod shape itself (ids, field names,
 *     regex whitelists). Evolving it requires a schema/api change.
 *   - **Content release**: the author-facing YAML in
 *     `api/schemas/<datachain_type>/<version>/` that conforms to this
 *     structural schema. New symbols, categories, and shape
 *     assignments ride in a content release.
 *
 * See plan "Key Technical Decisions" for the field transformations
 * applied during the v1→new migration (drop updated_at/symbol/
 * element-level context_type_id, rename name→title, add optional
 * citation, etc.).
 */
export const ElementSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe('Element id (no `__` prefix), whitelisted to [a-zA-Z0-9_-]'),
    category_id: z
      .string()
      .min(1)
      .describe(
        'Category id this element is placed in. Rule 1: must exist. Structural schema enforces a single id; one-element-per-category is an explicit design choice of the new structural schema (was an array in v1).',
      ),
    title: LocaleValueArraySchema.describe('Short title, one entry per locale'),
    description: LocaleValueArraySchema.describe(
      'Longer description. May reference variables via {{variable_id}} (rule 8).',
    ),
    citation: LocaleValueArraySchema.default([]).describe(
      'Optional citation/source text, one entry per locale. Seeded empty during the 2026-04-16 port.',
    ),
    symbol_id: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe(
        'Symbol library id (structural schema field). References a primitive SVG at `<content release>/symbols/<symbol_id>.svg`. Same whitelist as `id` so the value can appear directly in a URL path.',
      ),
    /**
     * Materialized by Unit 4's build step from the parent categories'
     * `element_variables`. Not author-facing in YAML source; present in
     * emitted `elements.json` so agents see a flat view.
     */
    variables: z
      .array(VariableSchema)
      .default([])
      .describe('Variables inherited from parent categories (materialized at build time)'),
  })
  .describe('A reusable DTPR element tile')

export type Element = z.infer<typeof ElementSchema>
