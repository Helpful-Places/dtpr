import type { ResolvedDatachainInstance } from '../../schema/datachain-instance-resolved.ts'
import type { SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * R14 wire enforcement:
 * `suggested_elements.length > 0 ⟹ authoring_provenance?.kind === 'ai_generated'`.
 *
 * Zod 4's `z.toJSONSchema` under `unrepresentable: 'any'` silently
 * drops `.refine(...)` callbacks, so the parse-time refinement does
 * not survive into the emitted JSON Schema (verified empirically in
 * `api/test/unit/json-schema-emit.test.ts` during U1). The semantic
 * validator carries the rule on the wire path so REST/MCP callers
 * that validate against the JSON Schema still get correct rejection.
 *
 * Empty `suggested_elements` ⇒ no enforcement (the implication is
 * vacuously true).
 */
export function checkProvenanceRequired(resolved: ResolvedDatachainInstance): SemanticError[] {
  if (resolved.suggested_elements.length === 0) return []
  const kind = resolved.authoring_provenance?.kind
  if (kind === 'ai_generated') return []
  return [
    err(
      'provenance_required',
      `Non-empty suggested_elements requires authoring_provenance.kind === 'ai_generated' (got ${kind ?? 'undefined'})`,
      {
        path: 'authoring_provenance',
        fix_hint: `Set authoring_provenance to { kind: 'ai_generated', ... }, or remove suggested_elements.`,
      },
    ),
  ]
}
