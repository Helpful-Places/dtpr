import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'
import { VariableSchema } from './variable.ts'

/**
 * An element icon. Split from the legacy `icon: /path.svg` string in the
 * v1 markdown content into a structured `{ url, format, alt_text }` shape
 * during Unit 5's migration.
 */
export const IconSchema = z
  .object({
    url: z.string().min(1).describe('Absolute or site-relative path to the icon resource'),
    format: z.string().min(1).describe('Icon format, e.g. "svg"'),
    alt_text: LocaleValueArraySchema.describe('Localized alt text'),
  })
  .describe('Element icon (decomposed from the legacy single-string icon field)')

export type Icon = z.infer<typeof IconSchema>

/**
 * An element — a reusable tile that can be placed in one or more categories.
 * See plan "Key Technical Decisions" for the field transformations applied
 * during the v1→new migration (drop updated_at/symbol/element-level
 * context_type_id, rename name→title, add optional citation, etc.).
 */
export const ElementSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe('Element id (no `__` prefix), whitelisted to [a-zA-Z0-9_-]'),
    category_ids: z
      .array(z.string().min(1))
      .min(1)
      .describe('Category ids this element is placed in. Rule 1: all must exist.'),
    title: LocaleValueArraySchema.describe('Short title, one entry per locale'),
    description: LocaleValueArraySchema.describe(
      'Longer description. May reference variables via {{variable_id}} (rule 8).',
    ),
    citation: LocaleValueArraySchema.default([]).describe(
      'Optional citation/source text, one entry per locale. Seeded empty during the 2026-04-16 port.',
    ),
    icon: IconSchema,
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
