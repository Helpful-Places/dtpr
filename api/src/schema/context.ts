import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'

/**
 * Hex color pattern (#RRGGBB). Enforced both by Zod (here) and by
 * semantic rule #13 so error shapes stay consistent.
 */
const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .describe('Six-digit hex color, e.g. "#F28C28"')

/**
 * `color` is nullable: when null, the renderer presents the value as a
 * tag (no colored dot). Categorical contexts like Role use this; range
 * contexts like PII keep hex colors.
 */
export const ContextValueSchema = z
  .object({
    id: z.string().min(1).describe('Context value id, unique within its context'),
    name: LocaleValueArraySchema.describe('Display name, one entry per locale'),
    description: LocaleValueArraySchema.describe('Short explanation of this context value'),
    color: HexColorSchema.nullable().describe(
      'Six-digit hex color, or null. When null, the renderer treats the value as a tag instead of a colored dot.',
    ),
  })
  .describe('A single selectable value within a category context (e.g. "ai_only")')

export type ContextValue = z.infer<typeof ContextValueSchema>

export const ContextSchema = z
  .object({
    id: z.string().min(1).describe('Context dimension id, unique within the category'),
    name: LocaleValueArraySchema,
    description: LocaleValueArraySchema,
    values: z
      .array(ContextValueSchema)
      .min(1)
      .describe('Selectable values. Ids must be unique within this context (rule 3).'),
  })
  .describe('A context dimension authored on a category; instances pick one of its values')

export type Context = z.infer<typeof ContextSchema>
