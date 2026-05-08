import type { ResolvedDatachainInstance } from '../../schema/datachain-instance-resolved.ts'
import type { SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * R15a (defensive): no `suggested_elements[].id` may match any
 * `schema_snapshot.elements[].id`. The Zod refinement on
 * `ResolvedDatachainInstanceSchema` already rejects collisions at parse
 * time, but the wire validator re-runs the check so callers that
 * skip parse (e.g. an internal pipeline that constructs the typed
 * value programmatically) still get the rule.
 *
 * Errors carry the colliding id and the snapshot-wins resolution
 * note in the fix hint.
 */
export function checkElementIdCollision(resolved: ResolvedDatachainInstance): SemanticError[] {
  const findings: SemanticError[] = []
  if (resolved.suggested_elements.length === 0) return findings
  const snapshotIds = new Set(resolved.schema_snapshot.elements.map((e) => e.id))
  for (const [si, s] of resolved.suggested_elements.entries()) {
    if (snapshotIds.has(s.id)) {
      findings.push(
        err(
          'element_id_collision',
          `suggested_elements[${si}].id '${s.id}' collides with an entry in schema_snapshot.elements`,
          {
            path: `suggested_elements[${si}].id`,
            fix_hint: `Rename the suggested element id, or remove it (snapshot wins on lookup; the collision is rejected to keep resolution unambiguous).`,
          },
        ),
      )
    }
  }
  return findings
}
