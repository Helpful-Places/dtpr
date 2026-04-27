import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Rule 1: Every element.category_id references a defined category.
 * Rule 2: Each category.datachain_type matches the datachain-type's id.
 * Rule 17: datachain-type.categories references defined categories with no duplicates.
 */
export function checkCategoryRefs(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  const categoryIds = new Set(source.categories.map((c) => c.id))

  // Rule 1
  for (const [ei, el] of source.elements.entries()) {
    if (!categoryIds.has(el.category_id)) {
      findings.push(
        err('CATEGORY_REF_MISSING', `Element '${el.id}' references unknown category '${el.category_id}'`, {
          path: `elements[${ei}].category_id`,
          fix_hint: `Set element '${el.id}' category_id to an existing category, or define category '${el.category_id}' in datachain-type.yaml and categories/.`,
        }),
      )
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

  // Subchains: each `categories[]` entry must reference a defined
  // category. Categories may belong to multiple subchains, so no
  // cross-subchain duplicate check.
  const seenSubchainIds = new Map<string, number>()
  for (const [si, sub] of source.datachainType.subchains.entries()) {
    const prevSub = seenSubchainIds.get(sub.id)
    if (prevSub !== undefined) {
      findings.push(
        err(
          'SUBCHAIN_DUPLICATE',
          `datachain-type.subchains lists subchain id '${sub.id}' multiple times`,
          {
            path: `datachainType.subchains[${si}].id`,
            fix_hint: `Rename or remove the duplicate subchain (first seen at index ${prevSub}).`,
          },
        ),
      )
    } else {
      seenSubchainIds.set(sub.id, si)
    }
    const seenInSub = new Map<string, number>()
    for (const [ci, cid] of sub.categories.entries()) {
      if (!categoryIds.has(cid)) {
        findings.push(
          err(
            'SUBCHAIN_CATEGORY_REF_MISSING',
            `datachain-type.subchains[${si}].categories[${ci}] references undefined category '${cid}'`,
            {
              path: `datachainType.subchains[${si}].categories[${ci}]`,
              fix_hint: `Use an id of an existing category in this schema version.`,
            },
          ),
        )
      }
      const prevC = seenInSub.get(cid)
      if (prevC !== undefined) {
        findings.push(
          err(
            'SUBCHAIN_CATEGORY_DUPLICATE',
            `datachain-type.subchains[${si}] lists category '${cid}' multiple times`,
            {
              path: `datachainType.subchains[${si}].categories[${ci}]`,
              fix_hint: `Remove the duplicate (first seen at index ${prevC}).`,
            },
          ),
        )
      } else {
        seenInSub.set(cid, ci)
      }
    }
  }

  return findings
}
