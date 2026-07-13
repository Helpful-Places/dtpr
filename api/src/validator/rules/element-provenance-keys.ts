import type { DatachainInstance } from '../../schema/datachain-instance.ts'
import type { SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Wire enforcement for `authoring_provenance.element_provenance` keys.
 *
 * For every key `k` in the map, exactly one of the following must hold:
 *
 *   1. `k` matches some `elements[].element_instance_id`. (Preferred.)
 *   2. `k` matches some `elements[].element_id` AND that `element_id`
 *      is placed exactly once AND that placement does not carry an
 *      `element_instance_id`.
 *
 * Otherwise we emit one of:
 *
 *   - `element_provenance_ambiguous` — `k` matches an `element_id`
 *     placed more than once. The caller almost certainly meant
 *     `element_instance_id`; we surface a distinct code instead of the
 *     generic "unknown" miss so the fix-hint can name the right path.
 *   - `element_provenance_unknown_element` — every other miss
 *     (no element with that id, or single placement that carries an
 *     `element_instance_id` and so no longer accepts the bare key).
 *
 * Runs against both wire forms. On the thin `DatachainInstance` the
 * placement set is just `instance.elements[]`; on the resolved form
 * the same set is used (snapshot vs suggested distinction lives in
 * the resolution rule, not here).
 *
 * Empty / missing `element_provenance` is a no-op.
 */
export function checkElementProvenanceKeys(instance: DatachainInstance): SemanticError[] {
  const provenance = instance.authoring_provenance
  if (!provenance || provenance.kind !== 'ai_generated') return []
  const map = provenance.element_provenance
  if (!map) return []

  // Index placements by element_instance_id and count placements per
  // element_id so the lookup rule can answer "placed once, no instance_id"
  // in O(1) per key.
  const placementsByInstanceId = new Set<string>()
  const placementCountByElementId = new Map<string, number>()
  const placementHasInstanceIdByElementId = new Map<string, boolean>()
  for (const p of instance.elements) {
    if (p.element_instance_id) placementsByInstanceId.add(p.element_instance_id)
    placementCountByElementId.set(
      p.element_id,
      (placementCountByElementId.get(p.element_id) ?? 0) + 1,
    )
    if (p.element_instance_id) {
      placementHasInstanceIdByElementId.set(p.element_id, true)
    }
  }

  const findings: SemanticError[] = []
  for (const key of Object.keys(map)) {
    if (placementsByInstanceId.has(key)) continue
    const count = placementCountByElementId.get(key)
    if (count === 1 && !placementHasInstanceIdByElementId.get(key)) continue

    if (count !== undefined && count > 1) {
      findings.push(
        err(
          'element_provenance_ambiguous',
          `authoring_provenance.element_provenance key "${key}" matches an element_id placed ${count} times; keys must use \`element_instance_id\` when the same element_id appears more than once`,
          {
            path: `authoring_provenance.element_provenance.${key}`,
            fix_hint:
              'Assign an `element_instance_id` to each placement of this element and key the entry by that id.',
          },
        ),
      )
    } else {
      findings.push(
        err(
          'element_provenance_unknown_element',
          `authoring_provenance.element_provenance key "${key}" does not match any placement's element_instance_id (or element_id when placed exactly once without an element_instance_id)`,
          {
            path: `authoring_provenance.element_provenance.${key}`,
            fix_hint:
              'Remove the orphaned entry, or key it by a placement\'s `element_instance_id` (preferred), or by an `element_id` that is placed exactly once and carries no `element_instance_id`.',
          },
        ),
      )
    }
  }
  return findings
}
