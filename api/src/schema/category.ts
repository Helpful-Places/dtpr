import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'
import { VariableSchema } from './variable.ts'
import { ContextSchema } from './context.ts'

/**
 * Shape primitive names the icon compositor recognizes. Each value
 * corresponds to a parameterized SVG path template authored in
 * `api/src/icons/shapes.ts` (structural schema — lives in code, not
 * in a content release).
 */
export const ShapeTypeEnum = z
  .enum(['hexagon', 'circle', 'rounded-square', 'octagon'])
  .describe('Shape primitive used to compose icons for elements in this category')

export type ShapeType = z.infer<typeof ShapeTypeEnum>

/**
 * Category id whitelist: alphanumerics, underscores, and hyphens.
 * Symmetric with the Element id pattern. The legacy
 * `<datachain_type>__<slug>` prefix is being phased out — new schema
 * versions use bare slugs (e.g. `accountable`, `functional_modes`).
 * The `__`-forbid refinement is intentionally omitted at the
 * structural layer so existing beta versions still load; the new
 * v2 convention is enforced by content, not schema.
 */
const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/

/**
 * A DTPR category — a bucket of elements (e.g. `accountable`). Categories
 * own the `element_variables` that their elements inherit and optionally
 * an authored `context` dimension that instances select a value from.
 *
 * Two shapes of content to distinguish when reading this file:
 *
 *   - **Structural schema**: the Zod shape itself (field names, enums).
 *   - **Content release**: the author-facing YAML that conforms to it.
 *
 * `shape` is part of the structural schema: the enum values match
 * shape primitives bundled with the API code, not release-specific
 * SVG assets.
 */
export const CategorySchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(SLUG_PATTERN)
      .describe('Category id (bare slug), whitelisted to [a-zA-Z0-9_-]'),
    name: LocaleValueArraySchema,
    description: LocaleValueArraySchema,
    prompt: LocaleValueArraySchema.default([]).describe(
      'Authoring prompt shown in editors; optional.',
    ),
    required: z
      .boolean()
      .default(false)
      .describe('Whether a datachain instance must include at least one element from this category (rule 7)'),
    order: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe('Default display order within the datachain type'),
    datachain_type: z
      .string()
      .min(1)
      .describe('Owning datachain type id (e.g. "ai"). Must match the version (rule 2).'),
    shape: ShapeTypeEnum.describe(
      'Icon shape primitive for elements in this category. Required by the structural schema; resolves to a parameterized SVG template bundled with the API code.',
    ),
    element_variables: z
      .array(VariableSchema)
      .default([])
      .describe('Variables inherited by elements placed in this category (source of truth)'),
    context: ContextSchema.optional().describe(
      'Optional context dimension that datachain instances can pick a value from',
    ),
  })
  .describe('A DTPR category definition')

export type Category = z.infer<typeof CategorySchema>
