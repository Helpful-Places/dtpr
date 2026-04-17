import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Rule 14: Element icon.url and icon.format are non-empty.
 * (Zod enforces min(1) on both fields; this layer mirrors the check so
 * the CLI surfaces a friendlier error with a fix_hint.)
 */
export function checkIcons(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  for (const [ei, el] of source.elements.entries()) {
    if (!el.icon.url || el.icon.url.trim().length === 0) {
      findings.push(
        err('ICON_URL_EMPTY', `Element '${el.id}' has empty icon.url`, {
          path: `elements[${ei}].icon.url`,
          fix_hint: `Provide a non-empty path to the element's icon asset.`,
        }),
      )
    }
    if (!el.icon.format || el.icon.format.trim().length === 0) {
      findings.push(
        err('ICON_FORMAT_EMPTY', `Element '${el.id}' has empty icon.format`, {
          path: `elements[${ei}].icon.format`,
          fix_hint: `Set icon.format to the asset extension (e.g. 'svg').`,
        }),
      )
    }
  }
  return findings
}
