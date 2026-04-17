import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'

/**
 * A template variable declared on a category and inherited by its elements.
 * Referenced in element descriptions as {{variable_id}} and populated in
 * datachain instances. Authored on categories (DRY source); materialized
 * onto elements in the emitted JSON bundle by Unit 4's build step.
 */
export const VariableSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe('Variable id, whitelisted to [a-zA-Z0-9_-] to allow safe string interpolation'),
    label: LocaleValueArraySchema.describe('Human-readable label for the variable'),
    required: z
      .boolean()
      .default(false)
      .describe('Whether a datachain instance must supply a value for this variable'),
  })
  .describe('A template variable declared on a category; referenced in element text as {{id}}')

export type Variable = z.infer<typeof VariableSchema>
