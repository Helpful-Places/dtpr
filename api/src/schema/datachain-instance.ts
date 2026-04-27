import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'
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
 * Action types the renderer surfaces beneath an element instance. Kept
 * deliberately small — `other` is intentionally not in the enum.
 */
export const InstanceActionTypeSchema = z
  .enum(['email', 'url', 'phone', 'form', 'postal'])
  .describe('Action affordance kind. Renderer maps each kind to a button or link surface.')

export type InstanceActionType = z.infer<typeof InstanceActionTypeSchema>

export const InstanceActionSchema = z
  .object({
    type: InstanceActionTypeSchema,
    label: LocaleValueArraySchema.describe('Localized button label.'),
    target: z
      .string()
      .min(1)
      .describe(
        'Target value: email address, URL, E.164 phone, form URL, or free-text postal address depending on `type`.',
      ),
  })
  .describe('A first-class action affordance attached to an element instance')

export type InstanceAction = z.infer<typeof InstanceActionSchema>

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
    subchain_instance_id: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Optional reference to a `subchain_instances[].id` on this datachain instance. Elements without this field render at the datachain root.',
      ),
    actions: z
      .array(InstanceActionSchema)
      .default([])
      .describe(
        'Optional first-class actions surfaced beneath this element (e.g. DPO email, DSAR form URL).',
      ),
  })
  .describe('An element placed on a datachain instance')

export type InstanceElement = z.infer<typeof InstanceElementSchema>

/**
 * Subchain instance — a concrete realization of a subchain defined on
 * the datachain type. Each instance pins one or more head elements
 * (typically functional-mode elements) and may carry an explicit
 * display order.
 */
export const SubchainInstanceSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe('Subchain instance id, unique within the datachain instance'),
    subchain_id: z
      .string()
      .min(1)
      .describe('References `DatachainType.subchains[].id` on the pinned schema version'),
    head_refs: z
      .array(z.string().min(1))
      .default([])
      .describe(
        'Optional list of element_ids that head this subchain instance (typically functional-mode elements).',
      ),
    order: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Optional explicit display order among sibling subchain instances.'),
  })
  .describe('Concrete realization of a datachain-type subchain on this instance')

export type SubchainInstance = z.infer<typeof SubchainInstanceSchema>

/**
 * Provenance reference attached to a datachain instance. Used to point
 * at AI registers, model cards, policy documents, or upstream API
 * documentation backing the disclosure.
 */
export const InstanceSourceTypeSchema = z
  .enum(['ai_register', 'model_card', 'policy_document', 'api_documentation', 'other'])
  .describe('Provenance reference kind')

export type InstanceSourceType = z.infer<typeof InstanceSourceTypeSchema>

export const InstanceSourceSchema = z
  .object({
    type: InstanceSourceTypeSchema,
    title: z.string().min(1).describe('Human-readable source title'),
    url: z.string().url().optional().describe('Optional URL to the source artifact'),
    citation: z.string().optional().describe('Optional citation/footnote text'),
  })
  .describe('Provenance reference for the disclosure')

export type InstanceSource = z.infer<typeof InstanceSourceSchema>

export const DatachainInstanceSchema = z
  .object({
    id: z.string().min(1).describe('Instance id (author-supplied, unique per deployment)'),
    schema_version: VersionStringSchema.describe('Pinned schema version, e.g. "ai@2026-04-16"'),
    created_at: z.string().datetime().describe('ISO 8601 timestamp of instance authoring'),
    updated_at: z
      .string()
      .datetime()
      .optional()
      .describe('Optional ISO 8601 timestamp of last revision (pairs with created_at).'),
    instance_version: z
      .string()
      .min(1)
      .optional()
      .describe('Optional free-text version of the deployed system (e.g. "v1.2.3").'),
    elements: z
      .array(InstanceElementSchema)
      .min(1)
      .describe('Elements placed on this datachain. Required categories must be covered (rule 7).'),
    subchain_instances: z
      .array(SubchainInstanceSchema)
      .default([])
      .describe(
        'Optional list of concrete subchain realizations. Each references a subchain defined on the pinned schema version.',
      ),
    sources: z
      .array(InstanceSourceSchema)
      .default([])
      .describe('Optional provenance references (AI register, model card, policy document, etc.).'),
    linked_instance_ids: z
      .array(z.string().min(1))
      .default([])
      .describe(
        'Optional cross-schema link extensibility seam (e.g. sensor↔AI). Forward-compatible hook; downstream schemas define how it is consumed.',
      ),
  })
  .describe('A concrete datachain — e.g. "Worcester license plate reader"')

export type DatachainInstance = z.infer<typeof DatachainInstanceSchema>
