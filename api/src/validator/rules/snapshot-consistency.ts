import type { Category } from '../../schema/category.ts'
import type { DatachainType } from '../../schema/datachain-type.ts'
import type { Element } from '../../schema/element.ts'
import type { ResolvedDatachain } from '../../schema/datachain-instance-resolved.ts'
import type { SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Canonical schema content for one pinned version, as fetched from
 * the live store. Returned by `LoadCanonicalSchema` when the version
 * is currently in the index.
 */
export interface CanonicalSchema {
  datachainType: DatachainType
  categories: Category[]
  elements: Element[]
}

/**
 * Loader contract injected into the validator for testability. The
 * loader returns:
 *
 *   - `null` when the pinned `schema_version` is **not** in
 *     `INDEX_KEY` — graceful degradation per R9: the validator skips
 *     the consistency check entirely (a deployed disclosure pinning
 *     a retired version still validates).
 *   - a `CanonicalSchema` otherwise; the validator structurally
 *     compares it against the snapshot pinned on the resolved
 *     datachain.
 */
export type LoadCanonicalSchema = (
  schemaVersion: string,
) => Promise<CanonicalSchema | null> | CanonicalSchema | null

/**
 * R9: snapshot consistency. Compares the pinned `schema_snapshot`
 * against the live store **only when** the pinned version is in
 * `INDEX_KEY`; otherwise skipped per R9's graceful degradation.
 *
 * Drift on any of `datachain_type`, `categories`, or `elements`
 * yields `snapshot_drift` errors with paths pointing at the drifted
 * branch. Comparison uses stable JSON serialization so order in
 * arrays is treated as significant — the resolver (U3) is expected
 * to write the snapshot in the canonical order.
 *
 * Async because the canonical loader hits the store; callers that
 * pass a sync stub still work.
 */
export async function checkSnapshotConsistency(
  resolved: ResolvedDatachain,
  load: LoadCanonicalSchema,
): Promise<SemanticError[]> {
  const canonical = await load(resolved.schema_version)
  if (!canonical) return [] // graceful degradation: version not in INDEX_KEY

  const findings: SemanticError[] = []
  const { schema_snapshot } = resolved

  if (!structurallyEqual(schema_snapshot.datachain_type, canonical.datachainType)) {
    findings.push(
      err(
        'snapshot_drift',
        `schema_snapshot.datachain_type differs from the canonical schema for '${resolved.schema_version}'`,
        {
          path: 'schema_snapshot.datachain_type',
          fix_hint: `Re-resolve the datachain against the current schema version, or pin a frozen version that matches this snapshot.`,
        },
      ),
    )
  }

  // Per R6 the snapshot carries a referenced subset of categories /
  // elements (only those needed for placement + required-categories
  // expansion), so equality against the full canonical pool would
  // always fail. Drift detection compares each snapshot item against
  // its canonical counterpart by id; a snapshot item with no
  // canonical match (or a per-id structural mismatch) is drift.
  for (const finding of subsetDrift(
    schema_snapshot.categories,
    canonical.categories,
    'schema_snapshot.categories',
    resolved.schema_version,
  )) {
    findings.push(finding)
  }
  for (const finding of subsetDrift(
    schema_snapshot.elements,
    canonical.elements,
    'schema_snapshot.elements',
    resolved.schema_version,
  )) {
    findings.push(finding)
  }

  return findings
}

function subsetDrift<T extends { id: string }>(
  snapshotItems: T[],
  canonicalItems: T[],
  path: string,
  schemaVersion: string,
): SemanticError[] {
  const canonicalById = new Map<string, T>()
  for (const item of canonicalItems) canonicalById.set(item.id, item)

  for (const snap of snapshotItems) {
    const canon = canonicalById.get(snap.id)
    if (!canon || !structurallyEqual(snap, canon)) {
      return [
        err(
          'snapshot_drift',
          `${path} differ from the canonical schema for '${schemaVersion}'`,
          {
            path,
            fix_hint: `Re-resolve the datachain against the current schema version, or pin a frozen version that matches this snapshot.`,
          },
        ),
      ]
    }
  }
  return []
}

/**
 * Structural equality via stable JSON serialization. Sufficient for
 * comparing two parsed schema branches that flow from the same Zod
 * shapes (no functions, no symbols, no Dates).
 */
function structurallyEqual(a: unknown, b: unknown): boolean {
  return canonicalize(a) === canonicalize(b)
}

function canonicalize(v: unknown): string {
  return JSON.stringify(normalize(v))
}

// Object keys sorted; arrays of `{locale, ...}` records sorted by
// locale (the resolver normalizes locale order to `manifest.locales`
// position; the canonical store load returns whatever order R2 gave
// us). Other arrays preserve order — drift detection treats list
// position as significant for non-locale arrays.
function normalize(v: unknown): unknown {
  if (Array.isArray(v)) {
    const items = v.map(normalize)
    if (items.every(isLocaleRecord)) {
      return [...items].sort((a, b) =>
        (a as { locale: string }).locale.localeCompare((b as { locale: string }).locale),
      )
    }
    return items
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const sorted: Record<string, unknown> = {}
    for (const k of Object.keys(o).sort()) sorted[k] = normalize(o[k])
    return sorted
  }
  return v
}

function isLocaleRecord(v: unknown): v is { locale: string } {
  return Boolean(v && typeof v === 'object' && typeof (v as { locale?: unknown }).locale === 'string')
}
