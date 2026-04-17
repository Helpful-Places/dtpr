import type { Category } from '../schema/category.ts'
import type { DatachainType } from '../schema/datachain-type.ts'
import type { Element } from '../schema/element.ts'
import type { SchemaManifest } from '../schema/manifest.ts'

/**
 * Input to the semantic validator: a fully parsed schema version as a
 * logical whole. Cross-file rules (category refs, variable conflicts,
 * category order) need this shape. The CLI's yaml-reader assembles it.
 */
export interface SchemaVersionSource {
  manifest: SchemaManifest
  datachainType: DatachainType
  categories: Category[]
  /**
   * Elements as authored (before category variables are materialized
   * onto them). The validator runs against authored source; the build
   * step materializes afterward.
   */
  elements: Element[]
  /**
   * Per-symbol SVG source, keyed by `symbol_id` (filename stem under
   * `<version.dir>/symbols/`). UTF-8 text, author-controlled input —
   * the build pipeline validates wrapper shape and rejects active
   * content before composing.
   */
  symbols: Record<string, string>
}

export type Severity = 'error' | 'warning'

export interface SemanticError {
  code: string
  message: string
  path?: string
  fix_hint?: string
  severity: Severity
}

export interface ValidationResult {
  ok: boolean
  errors: SemanticError[]
  warnings: SemanticError[]
}

export function err(
  code: string,
  message: string,
  opts: { path?: string; fix_hint?: string } = {},
): SemanticError {
  return { code, message, severity: 'error', ...opts }
}

export function warn(
  code: string,
  message: string,
  opts: { path?: string; fix_hint?: string } = {},
): SemanticError {
  return { code, message, severity: 'warning', ...opts }
}

/**
 * Partition a flat error list into the result envelope. All callers
 * go through this so `ok` and the error/warning split stay consistent.
 */
export function toResult(findings: SemanticError[]): ValidationResult {
  const errors = findings.filter((f) => f.severity === 'error')
  const warnings = findings.filter((f) => f.severity === 'warning')
  return { ok: errors.length === 0, errors, warnings }
}
