import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Rule 1: Every element.category_ids entry references a defined category.
 * Rule 2: Each category.datachain_type matches the datachain-type's id.
 * Rule 17: datachain-type.categories references defined categories with no duplicates.
 */
export function checkCategoryRefs(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  const categoryIds = new Set(source.categories.map((c) => c.id))

  // Rule 1
  for (const [ei, el] of source.elements.entries()) {
    for (const [ci, catId] of el.category_ids.entries()) {
      if (!categoryIds.has(catId)) {
        findings.push(
          err('CATEGORY_REF_MISSING', `Element '${el.id}' references unknown category '${catId}'`, {
            path: `elements[${ei}].category_ids[${ci}]`,
            fix_hint: `Remove category_id '${catId}' from element '${el.id}', or define the category in datachain-type.yaml and categories/.`,
          }),
        )
      }
    }
  }

  // Rule 2
  for (const [ci, cat] of source.categories.entries()) {
    if (cat.datachain_type !== source.datachainType.id) {
      findings.push(
        err(
          'DATACHAIN_TYPE_MISMATCH',
          `Category '${cat.id}' declares datachain_type '${cat.datachain_type}' but belongs to datachain-type '${source.datachainType.id}'`,
          {
            path: `categories[${ci}].datachain_type`,
            fix_hint: `Set categories[${ci}].datachain_type to '${source.datachainType.id}' or move this category to a different schema version.`,
          },
        ),
      )
    }
  }

  // Rule 17
  const seen = new Map<string, number>()
  for (const [i, id] of source.datachainType.categories.entries()) {
    if (!categoryIds.has(id)) {
      findings.push(
        err(
          'CATEGORY_ORDER_REF_MISSING',
          `datachain-type.categories[${i}] references undefined category '${id}'`,
          {
            path: `datachainType.categories[${i}]`,
            fix_hint: `Add a categories/${id}.yaml file, or remove this entry from datachain-type.categories.`,
          },
        ),
      )
    }
    const prev = seen.get(id)
    if (prev !== undefined) {
      findings.push(
        err(
          'CATEGORY_ORDER_DUPLICATE',
          `datachain-type.categories lists '${id}' multiple times`,
          {
            path: `datachainType.categories[${i}]`,
            fix_hint: `Remove the duplicate entry (first seen at index ${prev}).`,
          },
        ),
      )
    } else {
      seen.set(id, i)
    }
  }

  return findings
}
