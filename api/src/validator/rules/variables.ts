import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err, warn } from '../types.ts'
import type { Variable } from '../../schema/variable.ts'

const VARIABLE_REF_PATTERN = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g

function extractVariableRefs(text: string): string[] {
  const ids: string[] = []
  for (const match of text.matchAll(VARIABLE_REF_PATTERN)) {
    if (match[1]) ids.push(match[1])
  }
  return ids
}

/**
 * Rule 8: Every {{var}} in an element description references a variable
 * declared on the element or its category.
 * Rule 16: (Historically: conflict check across multiple categories.) With
 * the structural-schema change to a single `category_id`, an element can
 * no longer inherit conflicting definitions — kept here as a no-op
 * comment so readers know the rule number is intentionally not
 * exercised by this pass.
 * Rule 18 (warning-only at P1): variable references in the `en` description
 * must also appear in non-English descriptions for the same element.
 */
export function checkVariables(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  const categoryById = new Map(source.categories.map((c) => [c.id, c] as const))

  for (const [ei, el] of source.elements.entries()) {
    // Gather variables from the element's category.
    const merged = new Map<string, { variable: Variable; fromCategory: string }>()
    const cat = categoryById.get(el.category_id)
    // rule 1 already handles missing refs; avoid double-reporting
    if (cat) {
      for (const v of cat.element_variables) {
        merged.set(v.id, { variable: v, fromCategory: el.category_id })
      }
    }

    // Rule 8: every {{var}} reference resolves to a declared variable.
    const declaredIds = new Set(merged.keys())
    for (const entry of el.description) {
      const refs = extractVariableRefs(entry.value)
      for (const ref of refs) {
        if (!declaredIds.has(ref)) {
          findings.push(
            err(
              'VARIABLE_REF_MISSING',
              `Element '${el.id}' description references undefined variable '{{${ref}}}' (locale '${entry.locale}')`,
              {
                path: `elements[${ei}].description[${entry.locale}]`,
                fix_hint: `Declare variable '${ref}' on a parent category, remove the reference, or fix the typo.`,
              },
            ),
          )
        }
      }
    }

    // Rule 18 (warning): locale-consistent variable references. The en
    // description is treated as canonical; non-en locales should contain
    // the same variable references.
    const enEntry = el.description.find((d) => d.locale === 'en')
    if (enEntry) {
      const enRefs = new Set(extractVariableRefs(enEntry.value))
      for (const entry of el.description) {
        if (entry.locale === 'en') continue
        const entryRefs = new Set(extractVariableRefs(entry.value))
        for (const ref of enRefs) {
          if (!entryRefs.has(ref)) {
            findings.push(
              warn(
                'LOCALE_VARIABLE_DRIFT',
                `Element '${el.id}' description: variable '{{${ref}}}' appears in 'en' but not in '${entry.locale}'`,
                {
                  path: `elements[${ei}].description[${entry.locale}]`,
                  fix_hint: `Update the '${entry.locale}' translation to include the '{{${ref}}}' placeholder, or remove it from 'en'.`,
                },
              ),
            )
          }
        }
      }
    }
  }

  return findings
}
