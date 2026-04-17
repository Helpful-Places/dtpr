import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/

/**
 * Rule 13: Context value colors match /^#[0-9A-Fa-f]{6}$/.
 * Mirrors Zod's regex at the semantic layer for consistent error shape.
 */
export function checkColors(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  for (const [ci, cat] of source.categories.entries()) {
    if (!cat.context) continue
    for (const [vi, v] of cat.context.values.entries()) {
      if (!HEX_PATTERN.test(v.color)) {
        findings.push(
          err(
            'CONTEXT_VALUE_COLOR_INVALID',
            `Context value '${v.id}' has invalid color '${v.color}'`,
            {
              path: `categories[${ci}].context.values[${vi}].color`,
              fix_hint: `Use a six-digit hex color, e.g. '#F28C28'.`,
            },
          ),
        )
      }
    }
  }
  return findings
}
