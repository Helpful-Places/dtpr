import type { DatachainInstance } from '../schema/datachain-instance.ts'
import type { ResolvedDatachainInstance } from '../schema/datachain-instance-resolved.ts'
import { checkCategoryRefs } from './rules/category-refs.ts'
import { checkColorContrast } from './rules/color-contrast.ts'
import { checkColors } from './rules/colors.ts'
import { checkElementIdCollision } from './rules/element-id-collision.ts'
import { checkElementProvenanceKeys } from './rules/element-provenance-keys.ts'
import { checkInstance } from './rules/instance.ts'
import { checkLocales } from './rules/locales.ts'
import { checkProvenanceRequired } from './rules/provenance-required.ts'
import {
  buildResolvedElementLookup,
  checkResolvedElementResolution,
} from './rules/resolved-element-resolution.ts'
import {
  checkSnapshotConsistency,
  type LoadCanonicalSchema,
} from './rules/snapshot-consistency.ts'
import { checkSymbolRefs } from './rules/symbol-refs.ts'
import { checkUniqueness } from './rules/uniqueness.ts'
import { checkVariantReserved } from './rules/variant-reserved.ts'
import { checkVariables } from './rules/variables.ts'
import type { SchemaVersionSource, SemanticError, ValidationResult } from './types.ts'
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
    ...checkSymbolRefs(source),
    ...checkVariantReserved(source),
    ...checkColorContrast(source),
  ]
  return toResult(findings)
}

/**
 * Runs instance-level rules in the context of a validated schema version.
 * Structural (Zod) validation of both source and instance is the caller's
 * responsibility — this layer assumes parsed content.
 *
 * Includes `checkElementProvenanceKeys`: the rule fires on the thin
 * form too, because `authoring_provenance` is now allowed on the base
 * `DatachainInstance`. Orphan keys are silent dead data regardless of
 * which wire form carries them.
 */
export function validateInstance(
  source: SchemaVersionSource,
  instance: DatachainInstance,
): ValidationResult {
  const findings: SemanticError[] = [
    ...checkInstance(source, instance),
    ...checkElementProvenanceKeys(instance),
  ]
  return toResult(findings)
}

/**
 * Options for `validateResolvedInstance`. The canonical-schema loader
 * is dependency-injected so unit tests can stub R9 without standing
 * up the R2 store; production callers wire the live loader through.
 *
 * Returning `null` from the loader signals "version not in the live
 * index" — the snapshot-consistency check is then skipped per R9's
 * graceful-degradation contract.
 */
export interface ValidateResolvedOptions {
  loadCanonicalSchema?: LoadCanonicalSchema
}

/**
 * Runs the resolved-datachain semantic backstop. This is the runtime
 * companion to the Zod parse on the wire path: `validate_resolved`'s
 * REST and MCP entry points (U5/U6) do `Zod parse →
 * validateResolvedInstance → soft-failure envelope`.
 *
 * Rules run, in order:
 *   - **R15a (defensive)**: id collision between snapshot and
 *     suggested. Already enforced by Zod; mirrored here for callers
 *     that bypass parse.
 *   - **R14 (wire)**: `suggested_elements.length > 0 ⟹
 *     authoring_provenance.kind === 'ai_generated'`. Required
 *     because Zod's JSON Schema emit drops the conditional refine
 *     (verified in U1).
 *   - **R15 fallthrough**: every placement `element_id` resolves
 *     against `schema_snapshot.elements ∪ suggested_elements`.
 *   - **Instance-level rules** (cardinality, required categories,
 *     context refs, instance variables): re-run from
 *     `checkInstance` against the merged element pool.
 *   - **R9 snapshot consistency** (when a loader is provided and
 *     the version is in `INDEX_KEY`): structural compare of pinned
 *     `schema_snapshot` against the live store.
 *
 * No rule short-circuits: a single invocation surfaces every
 * finding so callers can render a complete error report.
 *
 * Async because R9 may hit the store; if no loader is passed, the
 * call still completes (snapshot consistency simply skipped).
 */
export async function validateResolvedInstance(
  resolved: ResolvedDatachainInstance,
  options: ValidateResolvedOptions = {},
): Promise<ValidationResult> {
  const findings: SemanticError[] = []

  // R15a: defensive id-collision check before we build the lookup map.
  findings.push(...checkElementIdCollision(resolved))

  // R14 wire enforcement — see provenance-required for why this can't
  // live in the JSON Schema.
  findings.push(...checkProvenanceRequired(resolved))

  // Per-element provenance keys must reference placed element_ids.
  findings.push(...checkElementProvenanceKeys(resolved))

  // Build the merged element-id lookup once and reuse for resolution +
  // instance-level rule re-run.
  const lookup = buildResolvedElementLookup(resolved)
  findings.push(...checkResolvedElementResolution(resolved, lookup))

  // Re-run the existing instance-level rules against the merged pool.
  // We construct a minimal `SchemaVersionSource` with only the fields
  // `checkInstance` consumes (`categories`, `elements`); everything
  // else is left as a structurally-valid empty/placeholder so a
  // future addition to `checkInstance` that touches another field
  // fails loudly in tests rather than silently dereferencing.
  const mergedElements = [
    ...resolved.schema_snapshot.elements,
    ...resolved.suggested_elements,
  ]
  const syntheticSource: SchemaVersionSource = {
    manifest: {
      version: resolved.schema_version,
      // 'beta' is a safe conservative default; if the schema version's
      // actual status matters to any checkInstance rule, wire the real
      // status down through ValidateResolvedOptions instead.
      status: 'beta' as const,
      created_at: '1970-01-01T00:00:00.000Z',
      notes: '',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: resolved.schema_snapshot.datachain_type.locales,
    },
    datachainType: resolved.schema_snapshot.datachain_type,
    categories: resolved.schema_snapshot.categories,
    elements: mergedElements,
    symbols: {},
  }
  findings.push(...checkInstance(syntheticSource, resolved))

  // R9 snapshot consistency, when wired. Loader returning null means
  // the pinned version isn't in `INDEX_KEY` — graceful skip.
  if (options.loadCanonicalSchema) {
    findings.push(...(await checkSnapshotConsistency(resolved, options.loadCanonicalSchema)))
  }

  return toResult(findings)
}
