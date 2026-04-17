import type { DatachainInstance } from '../schema/datachain-instance.ts'
import { checkCategoryRefs } from './rules/category-refs.ts'
import { checkColors } from './rules/colors.ts'
import { checkInstance } from './rules/instance.ts'
import { checkLocales } from './rules/locales.ts'
import { checkUniqueness } from './rules/uniqueness.ts'
import { checkVariables } from './rules/variables.ts'
import type { SchemaVersionSource, ValidationResult } from './types.ts'
import { toResult } from './types.ts'

/**
 * Runs every semantic rule that applies to a schema version source.
 * Rules never short-circuit; all findings are collected and returned
 * together so a single invocation shows the full picture.
 */
export function validateVersion(source: SchemaVersionSource): ValidationResult {
  const findings = [
    ...checkUniqueness(source),
    ...checkCategoryRefs(source),
    ...checkLocales(source),
    ...checkVariables(source),
    ...checkColors(source),
  ]
  return toResult(findings)
}

/**
 * Runs instance-level rules in the context of a validated schema version.
 * Structural (Zod) validation of both source and instance is the caller's
 * responsibility — this layer assumes parsed content.
 */
export function validateInstance(
  source: SchemaVersionSource,
  instance: DatachainInstance,
): ValidationResult {
  return toResult(checkInstance(source, instance))
}
