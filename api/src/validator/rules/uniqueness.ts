import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Rule 5: Category ids are unique within a schema version.
 * Rule 6: Element ids are unique within a schema version.
 * Rule 3: Within a category's context.values, ids are unique.
 */
export function checkUniqueness(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []

  // Rule 5
  const seenCategories = new Map<string, number>()
  for (const [idx, cat] of source.categories.entries()) {
    const prev = seenCategories.get(cat.id)
    if (prev !== undefined) {
      findings.push(
        err('CATEGORY_DUPLICATE', `Duplicate category id: ${cat.id}`, {
          path: `categories[${idx}].id`,
          fix_hint: `Rename or remove one of the categories with id '${cat.id}' (first seen at categories[${prev}]).`,
        }),
      )
    } else {
      seenCategories.set(cat.id, idx)
    }
  }

  // Rule 6
  const seenElements = new Map<string, number>()
  for (const [idx, el] of source.elements.entries()) {
    const prev = seenElements.get(el.id)
    if (prev !== undefined) {
      findings.push(
        err('ELEMENT_DUPLICATE', `Duplicate element id: ${el.id}`, {
          path: `elements[${idx}].id`,
          fix_hint: `Rename or remove one of the elements with id '${el.id}' (first seen at elements[${prev}]).`,
        }),
      )
    } else {
      seenElements.set(el.id, idx)
    }
  }

  // Rule 3
  for (const [ci, cat] of source.categories.entries()) {
    if (!cat.context) continue
    const seenValues = new Map<string, number>()
    for (const [vi, v] of cat.context.values.entries()) {
      const prev = seenValues.get(v.id)
      if (prev !== undefined) {
        findings.push(
          err(
            'CONTEXT_VALUE_DUPLICATE',
            `Duplicate context value id '${v.id}' on category '${cat.id}'`,
            {
              path: `categories[${ci}].context.values[${vi}].id`,
              fix_hint: `Rename or remove the duplicate context value (first seen at index ${prev}).`,
            },
          ),
        )
      } else {
        seenValues.set(v.id, vi)
      }
    }
  }

  // Rule 3 (element-level override): same uniqueness inside an
  // element's own context.values when present.
  for (const [ei, el] of source.elements.entries()) {
    if (!el.context) continue
    const seenValues = new Map<string, number>()
    for (const [vi, v] of el.context.values.entries()) {
      const prev = seenValues.get(v.id)
      if (prev !== undefined) {
        findings.push(
          err(
            'CONTEXT_VALUE_DUPLICATE',
            `Duplicate context value id '${v.id}' on element '${el.id}'`,
            {
              path: `elements[${ei}].context.values[${vi}].id`,
              fix_hint: `Rename or remove the duplicate context value (first seen at index ${prev}).`,
            },
          ),
        )
      } else {
        seenValues.set(v.id, vi)
      }
    }
  }

  return findings
}
