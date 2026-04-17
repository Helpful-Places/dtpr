/**
 * Public type re-exports for `@dtpr/ui/core` consumers.
 *
 * Inferred types are lifted straight from `@dtpr/api/schema` so there
 * is one canonical shape for DTPR content across api, ui, and
 * downstream consumers. This module also houses the small local types
 * used by core helpers (variable-type enum, display shapes) that are
 * not part of the schema but are part of the ui contract.
 */

export type {
  Element,
  Icon,
  Category,
  LocaleValue,
  Variable,
  InstanceElement,
  InstanceVariableValue,
  DatachainInstance,
  SchemaManifest,
} from '@dtpr/api/schema'

/**
 * Variable display type. Drawn from the variable-type enum conceptually
 * described in the plan. The underlying `Variable` schema does not yet
 * carry a `type` field; `deriveElementDisplay` defaults to `'text'` and
 * consumers (e.g. `<DtprElementDetail>`) can branch on `type` to render
 * URLs as anchors, booleans as toggles, etc.
 */
export type VariableType = 'text' | 'url' | 'boolean' | 'date' | 'number'

/**
 * Segmented interpolation output. Callers that want to render variable
 * substitutions differently from surrounding text (e.g. highlighting,
 * link-wrapping, a11y overlays) consume this instead of the plain-string
 * `interpolate` result.
 */
export type InterpolateSegment =
  | { kind: 'text'; value: string }
  | { kind: 'variable'; variable_id: string; value: string }
  | { kind: 'missing'; variable_id: string; value: string }

/**
 * Variable as rendered on an element display. `value` is the instance
 * value (or `''` when the datachain instance supplies none), `label`
 * is the locale-resolved declaration label, `required` is preserved
 * from the element's declared variable, and `type` defaults to `'text'`.
 */
export interface ElementDisplayVariable {
  id: string
  label: string
  value: string
  type: VariableType
  required: boolean
}

export interface ElementDisplayIcon {
  url: string
  alt: string
}

/**
 * Locale-resolved, instance-merged display props for a single element.
 * Produced by `deriveElementDisplay`; consumed by `<DtprElement>` and
 * `<DtprElementDetail>` (and their `/html` equivalents).
 */
export interface ElementDisplay {
  title: string
  description: string
  icon: ElementDisplayIcon
  variables: ElementDisplayVariable[]
  citation: string
}
