import { z } from 'zod'
import { VersionStringSchema } from './manifest.ts'

/**
 * A variable value as provided by a datachain instance. The value is
 * plain text; localization of instance-provided values is the author's
 * responsibility (the datachain belongs to a single deployment).
 */
export const InstanceVariableValueSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe('Variable id (must match a variable declared on the element\'s category, rule 9)'),
    value: z.string().describe('Concrete value for this variable'),
  })
  .describe('Variable value bound on a datachain instance element')

export type InstanceVariableValue = z.infer<typeof InstanceVariableValueSchema>

/**
 * An element as placed on a datachain instance. `context_type_id` is
 * instance-only (rule 4); element definitions never carry it (R25b).
 */
export const InstanceElementSchema = z
  .object({
    element_id: z.string().min(1).describe('Reference to an element defined in the schema version'),
    priority: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe('Non-negative display priority (rule 15)'),
    context_type_id: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Selected context value id from the element\'s category context. Must exist (rule 4).',
      ),
    variables: z
      .array(InstanceVariableValueSchema)
      .default([])
      .describe('Variable values for this element instance (rules 9, 10)'),
  })
  .describe('An element placed on a datachain instance')

export type InstanceElement = z.infer<typeof InstanceElementSchema>

export const DatachainInstanceSchema = z
  .object({
    id: z.string().min(1).describe('Instance id (author-supplied, unique per deployment)'),
    schema_version: VersionStringSchema.describe('Pinned schema version, e.g. "ai@2026-04-16"'),
    created_at: z.string().datetime().describe('ISO 8601 timestamp of instance authoring'),
    elements: z
      .array(InstanceElementSchema)
      .min(1)
      .describe('Elements placed on this datachain. Required categories must be covered (rule 7).'),
  })
  .describe('A concrete datachain — e.g. "Worcester license plate reader"')

export type DatachainInstance = z.infer<typeof DatachainInstanceSchema>
