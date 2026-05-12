import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'
import { ProvenanceRefSchema } from './provenance.ts'
import { ExampleSchema } from './example.ts'

const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/

/**
 * Variable kind discriminator. `localized_text` is the historical
 * shape: a free-text value supplied per locale. `multi_select_enum`
 * introduces a category-local controlled vocabulary — Element-light:
 * each option carries a name + description + applies_to but no
 * symbol. Options sit between `Category.element_context.values[]`
 * (single-select, structural axis) and full `Element` (renderable
 * with its own symbol).
 *
 * When `kind` is absent on input, `VariableSchema` preprocesses it
 * to `localized_text` so existing YAML and stored content parses
 * unchanged.
 */
export const VariableKindSchema = z
  .enum(['localized_text', 'multi_select_enum'])
  .describe('Variable kind. Defaults to localized_text on input for backwards compatibility.')

export type VariableKind = z.infer<typeof VariableKindSchema>

/**
 * One option in a `multi_select_enum` vocabulary. Element-light: it
 * carries the citizen-facing affordances of an element (name,
 * description, sources) without a symbol. `applies_to` lists the
 * parent element ids in the same category that this option may
 * attach to on an instance — validator-enforced. Per AAAIC, specific
 * harms are not mutually exclusive across parents, so `applies_to`
 * is a list rather than a single id.
 */
export const VariableOptionSchema = z
  .object({
    id: z
      .string()
      .regex(SLUG_PATTERN)
      .describe('Option id, unique within the variable'),
    name: LocaleValueArraySchema.describe('Localized option name. Renders as chip label.'),
    description: LocaleValueArraySchema.describe(
      'Localized one-line definition. Renders at tap/expand and on register-row detail.',
    ),
    applies_to: z
      .array(z.string().min(1))
      .min(1)
      .describe(
        'Parent element ids in the same category this option may attach to on an instance. Validator-enforced.',
      ),
    sources: z
      .array(ProvenanceRefSchema)
      .default([])
      .describe(
        'Optional per-option provenance (e.g. AAAIC sub-section, statutory cite). Composed with the variable-level sources at render time.',
      ),
    authoring_guidance: LocaleValueArraySchema.default([]).describe(
      'Optional author-facing one-liner — when to pick this option vs a sibling. Not rendered to citizens.',
    ),
    examples: z
      .array(ExampleSchema)
      .default([])
      .describe('Optional author-facing examples. Not rendered to citizens.'),
  })
  .describe('One option in a multi_select_enum vocabulary (Element-light)')

export type VariableOption = z.infer<typeof VariableOptionSchema>

const VariableBase = {
  id: z
    .string()
    .regex(SLUG_PATTERN)
    .describe('Variable id, whitelisted to [a-zA-Z0-9_-] to allow safe string interpolation'),
  label: LocaleValueArraySchema.describe('Human-readable label for the variable'),
  required: z
    .boolean()
    .default(false)
    .describe('Whether a datachain instance must supply a value for this variable'),
}

/**
 * Free-text per-locale value variable. The original DTPR variable
 * shape; remains the default kind for backwards compatibility.
 */
export const LocalizedTextVariableSchema = z
  .object({
    ...VariableBase,
    kind: z.literal('localized_text'),
  })
  .describe('Free-text per-locale variable (default kind)')

/**
 * Controlled-vocabulary multi-select variable. Each `option` is an
 * Element-light record (name, description, sources, applies_to).
 * `options` may be empty when a vocabulary is declared structurally
 * but not yet authored — the semantic layer warns on this state so
 * authors notice unfilled cells before stable promotion.
 */
export const MultiSelectEnumVariableSchema = z
  .object({
    ...VariableBase,
    kind: z.literal('multi_select_enum'),
    sources: z
      .array(ProvenanceRefSchema)
      .default([])
      .describe(
        'Vocabulary-level provenance/license (e.g. AAAIC paper + CC BY-SA 4.0). Per-option sources extend, not replace.',
      ),
    options: z
      .array(VariableOptionSchema)
      .default([])
      .describe(
        'Controlled vocabulary of Element-light options. Empty is structurally valid (vocabulary declared but unauthored); the semantic layer warns.',
      ),
  })
  .describe('Multi-select controlled-vocabulary variable (Element-light)')

/**
 * A template variable declared on a category and inherited by its
 * elements. Discriminated by `kind`; defaults to `localized_text`
 * when absent on input.
 *
 * The preprocess step preserves backwards compatibility for stored
 * content authored before the discriminator existed — every existing
 * YAML variable parses unchanged.
 */
export const VariableSchema = z.preprocess(
  (input) => {
    if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
      const obj = input as Record<string, unknown>
      if (!('kind' in obj)) {
        return { ...obj, kind: 'localized_text' }
      }
    }
    return input
  },
  z
    .discriminatedUnion('kind', [LocalizedTextVariableSchema, MultiSelectEnumVariableSchema])
    .describe(
      'A template variable declared on a category; referenced in element text as {{id}} for localized_text, or selected by id for multi_select_enum',
    ),
)

export type Variable = z.infer<typeof VariableSchema>
export type LocalizedTextVariable = z.infer<typeof LocalizedTextVariableSchema>
export type MultiSelectEnumVariable = z.infer<typeof MultiSelectEnumVariableSchema>

/**
 * Type guard helpers so consumers don't repeat the kind literal.
 */
export function isMultiSelectEnumVariable(v: Variable): v is MultiSelectEnumVariable {
  return v.kind === 'multi_select_enum'
}

export function isLocalizedTextVariable(v: Variable): v is LocalizedTextVariable {
  return v.kind === 'localized_text'
}
