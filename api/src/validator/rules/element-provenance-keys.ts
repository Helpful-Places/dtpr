import type { DatachainInstance } from '../../schema/datachain-instance.ts'
import type { SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Wire enforcement for `authoring_provenance.element_provenance` keys.
 * Every key in the map must reference an `element_id` that this
 * datachain actually places (i.e. appears in
 * `instance.elements[].element_id`). A key that points at a known
 * element which is not placed, or at an unknown element, is rejected:
 * the renderer composes per-element provenance against placements,
 * so an orphaned entry is silent dead data and almost always a bug
 * in the AI proposal output.
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

  const placedIds = new Set(instance.elements.map((p) => p.element_id))
  const findings: SemanticError[] = []
  for (const key of Object.keys(map)) {
    if (!placedIds.has(key)) {
      findings.push(
        err(
          'element_provenance_unknown_element',
          `authoring_provenance.element_provenance key "${key}" does not match any placement element_id`,
          {
            path: `authoring_provenance.element_provenance.${key}`,
            fix_hint:
              'Remove the orphaned entry, or place an element with this element_id on `elements`.',
          },
        ),
      )
    }
  }
  return findings
}
