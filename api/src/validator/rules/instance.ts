import type { DatachainInstance } from '../../schema/datachain-instance.ts'
import type { Variable } from '../../schema/variable.ts'
import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Instance-level rules. These run against a DatachainInstance in the
 * context of its pinned SchemaVersionSource.
 *
 * Rule 4: context_type_id on an instance element must be a value defined
 *         on one of the parent category's context.values.
 * Rule 7: required categories must have at least one element in the instance.
 * Rule 9: each instance variable id must be declared on the element's
 *         category element_variables.
 * Rule 10: required variables must have values.
 * Rule 15: priority is non-negative (Zod enforces; mirrored here).
 */
export function checkInstance(
  source: SchemaVersionSource,
  instance: DatachainInstance,
): SemanticError[] {
  const findings: SemanticError[] = []
  const categoryById = new Map(source.categories.map((c) => [c.id, c] as const))
  const elementById = new Map(source.elements.map((e) => [e.id, e] as const))

  // Helper: collected variable definitions for an element (from all its categories, deduped).
  const variablesForElement = (elementId: string): Map<string, Variable> => {
    const out = new Map<string, Variable>()
    const el = elementById.get(elementId)
    if (!el) return out
    for (const catId of el.category_ids) {
      const cat = categoryById.get(catId)
      if (!cat) continue
      for (const v of cat.element_variables) {
        if (!out.has(v.id)) out.set(v.id, v)
      }
    }
    return out
  }

  // Rule 7: required categories covered.
  const instanceCategoryIds = new Set<string>()
  for (const ie of instance.elements) {
    const el = elementById.get(ie.element_id)
    if (el) for (const cid of el.category_ids) instanceCategoryIds.add(cid)
  }
  for (const [ci, cat] of source.categories.entries()) {
    if (cat.required && !instanceCategoryIds.has(cat.id)) {
      findings.push(
        err(
          'REQUIRED_CATEGORY_MISSING',
          `Instance is missing at least one element from required category '${cat.id}'`,
          {
            path: `instance.elements[].category_ids`,
            fix_hint: `Add at least one element whose category_ids include '${cat.id}' (category defined at categories[${ci}]).`,
          },
        ),
      )
    }
  }

  for (const [ii, ie] of instance.elements.entries()) {
    // Element existence is foundational to the rest of the rules.
    const el = elementById.get(ie.element_id)
    if (!el) {
      findings.push(
        err(
          'INSTANCE_ELEMENT_UNKNOWN',
          `Instance references unknown element '${ie.element_id}'`,
          {
            path: `instance.elements[${ii}].element_id`,
            fix_hint: `Use an element defined in the pinned schema version (see list_elements).`,
          },
        ),
      )
      continue
    }

    // Rule 15 (defensive — Zod already blocks negative priority)
    if (ie.priority < 0) {
      findings.push(
        err('INSTANCE_PRIORITY_NEGATIVE', `Element '${el.id}' has negative priority`, {
          path: `instance.elements[${ii}].priority`,
          fix_hint: `Priority must be a non-negative integer.`,
        }),
      )
    }

    // Rule 4: context_type_id must match a value defined on one of the parent categories.
    if (ie.context_type_id) {
      let matched = false
      for (const catId of el.category_ids) {
        const cat = categoryById.get(catId)
        if (!cat?.context) continue
        if (cat.context.values.some((v) => v.id === ie.context_type_id)) {
          matched = true
          break
        }
      }
      if (!matched) {
        findings.push(
          err(
            'CONTEXT_TYPE_UNKNOWN',
            `Element '${el.id}' context_type_id '${ie.context_type_id}' is not defined on any of its categories' contexts`,
            {
              path: `instance.elements[${ii}].context_type_id`,
              fix_hint: `Pick a context value defined on one of '${el.category_ids.join(", ")}' (see get_element).`,
            },
          ),
        )
      }
    }

    // Rule 9 and 10: instance variables validated against element's inherited definitions.
    const defined = variablesForElement(el.id)
    const providedIds = new Set(ie.variables.map((v) => v.id))
    for (const [vi, iv] of ie.variables.entries()) {
      if (!defined.has(iv.id)) {
        findings.push(
          err(
            'INSTANCE_VARIABLE_UNKNOWN',
            `Element '${el.id}' instance variable '${iv.id}' is not declared on any of its categories`,
            {
              path: `instance.elements[${ii}].variables[${vi}].id`,
              fix_hint: `Remove the variable or declare it on one of this element's categories (${el.category_ids.join(", ")}).`,
            },
          ),
        )
      }
    }
    for (const v of defined.values()) {
      if (v.required && !providedIds.has(v.id)) {
        findings.push(
          err(
            'INSTANCE_REQUIRED_VARIABLE_MISSING',
            `Element '${el.id}' is missing required variable '${v.id}'`,
            {
              path: `instance.elements[${ii}].variables`,
              fix_hint: `Add an entry { id: '${v.id}', value: '...' } to this element's variables.`,
            },
          ),
        )
      }
    }
  }

  return findings
}
