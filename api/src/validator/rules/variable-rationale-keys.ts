import type { DatachainInstance } from '../../schema/datachain-instance.ts'
import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Wire enforcement for `authoring_provenance.element_provenance[<id>]
 * .variable_rationale` keys. Every key in the per-element rationale
 * map must reference a variable declared on the placed element's
 * category (the same scope `INSTANCE_VARIABLE_UNKNOWN` enforces for
 * instance variables). A stale entry — e.g. after a schema variable
 * rename — would otherwise sit as silent dead data, mirroring the
 * orphan-element-id risk that `checkElementProvenanceKeys` catches at
 * the outer map level.
 *
 * Runs on both wire forms via `validateInstance` (thin) and
 * `validateResolvedInstance` (resolved, against the merged
 * snapshot ∪ suggested pool). Empty / missing `variable_rationale`
 * is a no-op. A `variable_rationale` keyed under an `element_id`
 * that isn't placed is already caught by
 * `checkElementProvenanceKeys`; this rule skips those entries to
 * avoid duplicate findings.
 */
export function checkVariableRationaleKeys(
  source: SchemaVersionSource,
  instance: DatachainInstance,
): SemanticError[] {
  const provenance = instance.authoring_provenance
  if (!provenance || provenance.kind !== 'ai_generated') return []
  const map = provenance.element_provenance
  if (!map) return []

  const categoryById = new Map(source.categories.map((c) => [c.id, c] as const))
  const elementById = new Map(source.elements.map((e) => [e.id, e] as const))

  // Index variable definitions per placed element id, via the
  // element's category. Categories' element_variables is the same
  // source `checkInstance` consults for INSTANCE_VARIABLE_UNKNOWN.
  const placementIds = new Set(instance.elements.map((p) => p.element_id))

  const findings: SemanticError[] = []
  for (const [elementId, entry] of Object.entries(map)) {
    if (!entry?.variable_rationale) continue
    if (!placementIds.has(elementId)) continue // checkElementProvenanceKeys handles orphans
    const el = elementById.get(elementId)
    if (!el) continue // unknown element id is INSTANCE_ELEMENT_UNKNOWN's lane
    const cat = categoryById.get(el.category_id)
    const definedIds = new Set((cat?.element_variables ?? []).map((v) => v.id))

    for (const variableId of Object.keys(entry.variable_rationale)) {
      if (!definedIds.has(variableId)) {
        findings.push(
          err(
            'variable_rationale_unknown_variable',
            `authoring_provenance.element_provenance.${elementId}.variable_rationale references unknown variable '${variableId}' (not declared on category '${el.category_id}')`,
            {
              path: `authoring_provenance.element_provenance.${elementId}.variable_rationale.${variableId}`,
              fix_hint: `Remove the entry, or declare '${variableId}' on category '${el.category_id}' (see element_variables).`,
            },
          ),
        )
      }
    }
  }
  return findings
}
