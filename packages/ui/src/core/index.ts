/**
 * Public surface for `@dtpr/ui/core`. Framework-neutral primitives:
 * locale extraction, variable interpolation, category grouping,
 * element-display derivation, datachain validation, and the hexagon
 * fallback icon constant. No framework deps.
 */

export { extract, extractWithLocale } from './locale.js'
export type { ExtractWithLocaleResult } from './locale.js'

export { interpolate, interpolateSegments } from './interpolate.js'

export {
  groupElementsByCategory,
  sortCategoriesByOrder,
  findCategoryDefinition,
} from './categories.js'

export { deriveElementDisplay } from './element-display.js'
export type { DeriveElementDisplayOptions } from './element-display.js'

export {
  buildResolvedSections,
  buildResolvedDatachain,
} from './build-resolved-sections.js'
export type {
  BuildResolvedSectionsOptions,
  RenderedSection,
  ResolvedDatachainRender,
} from './build-resolved-sections.js'

export { validateDatachain } from './validate.js'
export type {
  SchemaVersionSource,
  SemanticError,
  Severity,
  ValidationResult,
} from './validate.js'

export { HEXAGON_FALLBACK_DATA_URI } from './icons.js'

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
  ConfidenceLevel,
  ElementProvenance,
  ResolvedDatachainInstance,
  SchemaSnapshot,
  SourceReference,
  VariableType,
  InterpolateSegment,
  ElementDisplay,
  ElementDisplayIcon,
  ElementDisplayVariable,
  ElementDisplayProvenance,
  ProvenanceRef,
  ProvenanceType,
} from './types.js'
