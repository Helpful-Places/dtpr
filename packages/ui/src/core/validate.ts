import { validateInstance } from '@dtpr/api/validator'
import type { DatachainInstance } from '@dtpr/api/schema'
import type { SchemaVersionSource, ValidationResult } from '@dtpr/api/validator'

export type { SchemaVersionSource, SemanticError, Severity, ValidationResult } from '@dtpr/api/validator'

/**
 * Validate a datachain instance against a schema version source.
 *
 * Thin wrapper around `@dtpr/api/validator`'s `validateInstance`. The
 * underlying validator runs the semantic rules (category refs,
 * variable conflicts, required-variable coverage, etc.) and returns
 * the `{ok, errors, warnings}` envelope unchanged — we re-export that
 * type so `@dtpr/ui/core` consumers don't need to import from
 * `@dtpr/api/validator` directly.
 *
 * Structural (Zod) validation of the inputs is the caller's
 * responsibility: they are assumed parsed already.
 */
export function validateDatachain(
  source: SchemaVersionSource,
  instance: DatachainInstance,
): ValidationResult {
  return validateInstance(source, instance)
}
