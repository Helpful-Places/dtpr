import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'
import { VariableSchema } from './variable.ts'
import { ContextSchema } from './context.ts'

/**
 * A DTPR category — a bucket of elements (e.g. `ai__decision`). Categories
 * own the `element_variables` that their elements inherit and optionally
 * an authored `context` dimension that instances select a value from.
 */
export const CategorySchema = z
  .object({
    id: z.string().min(1).describe('Category id, conventionally `<datachain_type>__<slug>`'),
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
