/**
 * Public type re-exports for `@dtpr/ui/core` consumers.
 *
 * Inferred types are lifted straight from `@dtpr/api/schema` so there
 * is one canonical shape for DTPR content across api, ui, and
 * downstream consumers. This module also houses the small local types
 * used by core helpers (variable-type enum, display shapes) that are
 * not part of the schema but are part of the ui contract.
 */

import type { AuthoringProvenance } from '@dtpr/api/schema'

export type {
  Element,
  Category,
  LocaleValue,
  Variable,
  InstanceElement,
  InstanceVariableValue,
  DatachainInstance,
  SchemaManifest,
  AuthoringProvenance,
  ResolvedDatachain,
  SchemaSnapshot,
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
  // Optional dark-mode URL (e.g. the composed-icon `dark` variant —
  // `/elements/:id/icon.dark.svg`). When set, `<DtprIcon>` swaps to
  // this src when the host is in dark mode (html.dark class or
  // prefers-color-scheme). Omit and the light url is used in both modes.
  urlDark?: string
  alt: string
}

/**
 * Locale-resolved selected context value for an element. Populated when
 * the source `InstanceElement` carries a `contextValueId` that resolves
 * against the element's effective context (element-level override or
 * category-level default). `color` is the value's hex color, or `null`
 * for tag-style values that should render as a neutral chip.
 */
export interface ElementDisplayContextValue {
  id: string
  name: string
  color: string | null
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
  /**
   * The selected context value for this element, when the instance
   * supplies one. Renderers show this as a tag below the title.
   * Undefined when no instance/no selection.
   */
  contextValue?: ElementDisplayContextValue
  /**
   * True when this element came from a `ResolvedDatachain`'s
   * `suggested_elements` (R15) and the caller has the proposed
   * indicator turned on (R15b — default). Renderers surface this as
   * a "proposed" badge so readers can distinguish AI-suggested
   * elements from snapshot-pinned ones at a glance.
   *
   * Populated by `buildResolvedSections`; `deriveElementDisplay`
   * itself does not set this field — the resolved-form helper merges
   * it after derivation. Existing callers that route through the
   * non-resolved `buildSections` ignore the field entirely.
   */
  proposed?: boolean
  /**
   * Authoring provenance carried from the resolved datachain (R10).
   * The same provenance object is attached to every element on the
   * datachain — provenance is whole-disclosure, not per-element. The
   * detail renderer uses this to render the AI-proposal-context
   * section (R15c). Undefined for non-resolved-form rendering paths
   * and for resolved datachains that omit `authoring_provenance`.
   */
  provenance?: AuthoringProvenance
}
