import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Reserved variant tokens — the compositor hard-codes these, so a
 * category context can't shadow them without breaking the
 * `(element × variant)` pre-bake map.
 */
const RESERVED_VARIANT_TOKENS = new Set(['default', 'dark'])

/**
 * Rule: no `ContextValue.id` may collide with a reserved variant
 * token (`default`, `dark`). The build's `icon_variants` list is
 * `['default', 'dark', ...context.values.map(v => v.id)]`, so a
 * collision would produce duplicate keys and overwrite one variant
 * with another at pre-bake time.
 */
export function checkVariantReserved(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  for (const [ci, cat] of source.categories.entries()) {
    if (!cat.context) continue
    for (const [vi, v] of cat.context.values.entries()) {
      if (RESERVED_VARIANT_TOKENS.has(v.id)) {
        findings.push(
          err(
            'RESERVED_VARIANT_TOKEN',
            `Context value '${v.id}' on category '${cat.id}' collides with reserved variant token`,
            {
              path: `categories[${ci}].context.values[${vi}].id`,
              fix_hint: `Rename this context value to something other than ${[...RESERVED_VARIANT_TOKENS]
                .map((t) => `'${t}'`)
                .join(' or ')} — these names are reserved by the icon compositor.`,
            },
          ),
        )
      }
    }
  }
  return findings
}
