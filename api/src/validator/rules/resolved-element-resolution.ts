import type { Element } from '../../schema/element.ts'
import type { ResolvedDatachain } from '../../schema/datachain-instance-resolved.ts'
import type { SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Source of an element looked up against the merged pool of a
 * `ResolvedDatachain`. Snapshot wins on collision (collisions are
 * separately reported by `element-id-collision`); knowing the source
 * is useful to downstream rules that want to flag suggested-only ids.
 */
export type ElementSource = 'snapshot' | 'suggested'

export interface ResolvedElementLookup {
  element: Element
  source: ElementSource
}

/**
 * Build the merged element-id lookup map for a resolved datachain.
 * Snapshot wins on collision so resolution is unambiguous; the
 * collision itself is detected by `element-id-collision`.
 */
export function buildResolvedElementLookup(
  resolved: ResolvedDatachain,
): Map<string, ResolvedElementLookup> {
  const out = new Map<string, ResolvedElementLookup>()
  // Suggested first so snapshot overwrites on collision (defensive —
  // R15a is the source of truth and rejects collisions outright).
  for (const e of resolved.suggested_elements) {
    out.set(e.id, { element: e, source: 'suggested' })
  }
  for (const e of resolved.schema_snapshot.elements) {
    out.set(e.id, { element: e, source: 'snapshot' })
  }
  return out
}

/**
 * R15 fallthrough: every `elements[].element_id` placement on a
 * resolved datachain must resolve against
 * `schema_snapshot.elements ∪ suggested_elements`.
 *
 * Mirrors `INSTANCE_ELEMENT_UNKNOWN` but operates against the merged
 * pool. Emits `unknown_element_id` (lower-case) so the wire envelope
 * has a stable code distinct from the legacy instance check.
 */
export function checkResolvedElementResolution(
  resolved: ResolvedDatachain,
  lookup: Map<string, ResolvedElementLookup>,
): SemanticError[] {
  const findings: SemanticError[] = []
  for (const [ii, ie] of resolved.elements.entries()) {
    if (!lookup.has(ie.element_id)) {
      findings.push(
        err(
          'unknown_element_id',
          `Resolved datachain references unknown element '${ie.element_id}'`,
          {
            path: `elements[${ii}].element_id`,
            fix_hint: `Add element '${ie.element_id}' to schema_snapshot.elements or suggested_elements, or change the placement.`,
          },
        ),
      )
    }
  }
  return findings
}
