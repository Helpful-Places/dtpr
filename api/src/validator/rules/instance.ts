import type { DatachainInstance } from '../../schema/datachain-instance.ts'
import { isMultiSelectEnumVariable, type Variable } from '../../schema/variable.ts'
import type { LocaleValue } from '../../schema/locale.ts'
import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err, warn } from '../types.ts'

/**
 * Distinguish the two value shapes carried by InstanceVariableValue.
 * The Zod union accepts either; the semantic layer routes on the
 * declared variable's kind. A LocaleValueArray is an array of
 * objects with `locale` + `value` keys; a multi_select_enum value is
 * an array of plain strings.
 */
function isStringArrayValue(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isLocaleValueArray(value: unknown): value is LocaleValue[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        v !== null &&
        typeof v === 'object' &&
        'locale' in v &&
        'value' in v &&
        typeof (v as { locale: unknown }).locale === 'string' &&
        typeof (v as { value: unknown }).value === 'string',
    )
  )
}

/**
 * Instance-level rules. These run against a DatachainInstance in the
 * context of its pinned SchemaVersionSource.
 *
 * Rule 4: context_type_id on an instance element must be a value defined
 *         on the parent category's context.values. If the effective
 *         context exists but context_type_id is absent, the instance
 *         is missing a structural discriminator — surfaced as a
 *         `CONTEXT_TYPE_MISSING` warning so historic published chains
 *         still pass.
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

  // Helper: collected variable definitions for an element (from its category).
  const variablesForElement = (elementId: string): Map<string, Variable> => {
    const out = new Map<string, Variable>()
    const el = elementById.get(elementId)
    if (!el) return out
    const cat = categoryById.get(el.category_id)
    if (!cat) return out
    for (const v of cat.element_variables) {
      if (!out.has(v.id)) out.set(v.id, v)
    }
    return out
  }

  // Rule 7: required categories covered.
  const instanceCategoryIds = new Set<string>()
  for (const ie of instance.elements) {
    const el = elementById.get(ie.element_id)
    if (el) instanceCategoryIds.add(el.category_id)
  }
  for (const [ci, cat] of source.categories.entries()) {
    if (cat.required && !instanceCategoryIds.has(cat.id)) {
      findings.push(
        err(
          'REQUIRED_CATEGORY_MISSING',
          `Instance is missing at least one element from required category '${cat.id}'`,
          {
            path: `instance.elements[].category_id`,
            fix_hint: `Add at least one element whose category_id is '${cat.id}' (category defined at categories[${ci}]).`,
          },
        ),
      )
    }
  }

  // element_instance_id uniqueness within a single instance (see plan
  // `element_instance_id` Option 1). Same scope as
  // `subchain_instances[].id`.
  const seenInstanceIds = new Map<string, number>()
  for (const [ii, ie] of instance.elements.entries()) {
    if (!ie.element_instance_id) continue
    const firstIdx = seenInstanceIds.get(ie.element_instance_id)
    if (firstIdx !== undefined) {
      findings.push(
        err(
          'INSTANCE_ELEMENT_INSTANCE_ID_DUPLICATE',
          `element_instance_id '${ie.element_instance_id}' is used by more than one placement (first at elements[${firstIdx}])`,
          {
            path: `instance.elements[${ii}].element_instance_id`,
            fix_hint:
              'element_instance_id must be unique within `elements[]`. Rename one of the placements.',
          },
        ),
      )
    } else {
      seenInstanceIds.set(ie.element_instance_id, ii)
    }
  }

  // Cross-namespace collision: an element_instance_id must not equal
  // any element_id on this instance's `elements[]`. If it did, a
  // provenance map key matching that string would resolve under the
  // element_instance_id branch (validator + renderer accept it) AND
  // under the bare-element_id backward-compat branch in the renderer
  // (when the colliding element_id is placed exactly once with no
  // element_instance_id of its own), silently attaching the same
  // entry to two distinct placements.
  const placedElementIds = new Set(instance.elements.map((p) => p.element_id))
  for (const [ii, ie] of instance.elements.entries()) {
    if (!ie.element_instance_id) continue
    if (placedElementIds.has(ie.element_instance_id)) {
      findings.push(
        err(
          'INSTANCE_ELEMENT_INSTANCE_ID_COLLIDES_WITH_ELEMENT_ID',
          `element_instance_id '${ie.element_instance_id}' collides with an element_id placed on this instance; the two namespaces must be disjoint`,
          {
            path: `instance.elements[${ii}].element_instance_id`,
            fix_hint:
              'Rename the element_instance_id so it does not match any element_id placed on this instance.',
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

    // Rule 4: context_type_id must match a value defined on the
    // element's effective context. Element.context overrides
    // Category.element_context fully (no merge); resolve in that order.
    // When the effective context exists but the instance omits
    // context_type_id, emit a CONTEXT_TYPE_MISSING warning rather than
    // an error — historic published chains predate this discriminator
    // and must keep passing — but make the silence audible so authors
    // can opt in. If a future taxonomy needs hard enforcement, add
    // `Category.element_context.required: boolean` and promote this
    // finding to `err(...)` when the flag is true.
    const cat = categoryById.get(el.category_id)
    const effectiveCtx = el.context ?? cat?.element_context
    if (ie.context_type_id) {
      const matched = !!effectiveCtx?.values.some((v) => v.id === ie.context_type_id)
      if (!matched) {
        findings.push(
          err(
            'CONTEXT_TYPE_UNKNOWN',
            `Element '${el.id}' context_type_id '${ie.context_type_id}' is not defined on its element or category '${el.category_id}' context`,
            {
              path: `instance.elements[${ii}].context_type_id`,
              fix_hint: `Pick a context value defined on element '${el.id}' or category '${el.category_id}' (see get_element).`,
            },
          ),
        )
      }
    } else if (effectiveCtx) {
      const available = effectiveCtx.values.map((v) => v.id).join(', ')
      findings.push(
        warn(
          'CONTEXT_TYPE_MISSING',
          `Element '${el.id}' is in category '${el.category_id}' which declares an element_context ('${effectiveCtx.id}'); instance omits context_type_id.`,
          {
            path: `instance.elements[${ii}].context_type_id`,
            fix_hint: `Set context_type_id to one of: ${available} (see get_schema or get_element).`,
          },
        ),
      )
    }

    // Rule 9 and 10: instance variables validated against element's inherited definitions.
    // Rule 12 (mirrored on instances): a provided variable must carry at
    // least one localized entry for localized_text — Zod accepts `value: []`
    // because LocaleValueArraySchema has no min, so the check lives here.
    // Rule 20 (new): for multi_select_enum variables, value must be a
    // list of option ids; each id must exist in options[]; each option's
    // applies_to must include this element_id.
    const defined = variablesForElement(el.id)
    const providedIds = new Set(ie.variables.map((v) => v.id))
    for (const [vi, iv] of ie.variables.entries()) {
      const declared = defined.get(iv.id)
      if (!declared) {
        findings.push(
          err(
            'INSTANCE_VARIABLE_UNKNOWN',
            `Element '${el.id}' instance variable '${iv.id}' is not declared on its category`,
            {
              path: `instance.elements[${ii}].variables[${vi}].id`,
              fix_hint: `Remove the variable or declare it on this element's category (${el.category_id}).`,
            },
          ),
        )
        continue
      }
      if (isMultiSelectEnumVariable(declared)) {
        if (!isStringArrayValue(iv.value)) {
          findings.push(
            err(
              'INSTANCE_VARIABLE_VALUE_SHAPE',
              `Element '${el.id}' instance variable '${iv.id}' is a multi_select_enum; value must be a list of option ids`,
              {
                path: `instance.elements[${ii}].variables[${vi}].value`,
                fix_hint: `Provide value as ["option_id_a", "option_id_b"] referencing declared options on the variable.`,
              },
            ),
          )
          continue
        }
        if (iv.value.length === 0) {
          const emptyHint = declared.required
            ? `Select at least one option id (the variable is required, so omitting the entry would fail INSTANCE_REQUIRED_VARIABLE_MISSING).`
            : `Select at least one option id, or omit the variable entirely.`
          findings.push(
            err(
              'INSTANCE_VARIABLE_VALUE_EMPTY',
              `Element '${el.id}' instance variable '${iv.id}' has no selected options`,
              {
                path: `instance.elements[${ii}].variables[${vi}].value`,
                fix_hint: emptyHint,
              },
            ),
          )
          continue
        }
        const optionsById = new Map(declared.options.map((o) => [o.id, o] as const))
        const seenSelections = new Map<string, number>()
        for (const [si, selectedId] of iv.value.entries()) {
          const prev = seenSelections.get(selectedId)
          if (prev !== undefined) {
            findings.push(
              err(
                'INSTANCE_VARIABLE_VALUE_DUPLICATE',
                `Element '${el.id}' instance variable '${iv.id}' selects '${selectedId}' more than once`,
                {
                  path: `instance.elements[${ii}].variables[${vi}].value[${si}]`,
                  fix_hint: `Remove the duplicate selection (first seen at index ${prev}).`,
                },
              ),
            )
            continue
          }
          seenSelections.set(selectedId, si)
          const option = optionsById.get(selectedId)
          if (!option) {
            findings.push(
              err(
                'INSTANCE_VARIABLE_OPTION_UNKNOWN',
                `Element '${el.id}' instance variable '${iv.id}' selects unknown option '${selectedId}'`,
                {
                  path: `instance.elements[${ii}].variables[${vi}].value[${si}]`,
                  fix_hint: `Use an option id declared on the variable's options[] (see get_schema).`,
                },
              ),
            )
            continue
          }
          if (!option.applies_to.includes(el.id)) {
            findings.push(
              err(
                'INSTANCE_VARIABLE_OPTION_NOT_APPLICABLE',
                `Option '${selectedId}' of variable '${iv.id}' does not apply to parent element '${el.id}'`,
                {
                  path: `instance.elements[${ii}].variables[${vi}].value[${si}]`,
                  fix_hint: `Pick a different option whose applies_to includes '${el.id}', or attach this option to a parent element it does apply to.`,
                },
              ),
            )
          }
        }
        continue
      }
      // localized_text branch: value must be a LocaleValueArray.
      if (!isLocaleValueArray(iv.value)) {
        findings.push(
          err(
            'INSTANCE_VARIABLE_VALUE_SHAPE',
            `Element '${el.id}' instance variable '${iv.id}' is a localized_text variable; value must be a LocaleValueArray`,
            {
              path: `instance.elements[${ii}].variables[${vi}].value`,
              fix_hint: `Provide value as [{ locale: 'en', value: '...' }] entries.`,
            },
          ),
        )
        continue
      }
      if (iv.value.length === 0) {
        findings.push(
          err(
            'INSTANCE_VARIABLE_VALUE_EMPTY',
            `Element '${el.id}' instance variable '${iv.id}' has no localized values`,
            {
              path: `instance.elements[${ii}].variables[${vi}].value`,
              fix_hint: `Add at least one entry, e.g. [{ locale: 'en', value: '...' }].`,
            },
          ),
        )
      }
    }
    for (const v of defined.values()) {
      if (v.required && !providedIds.has(v.id)) {
        const fixShape = isMultiSelectEnumVariable(v)
          ? `["option_id"]`
          : `[{ locale: 'en', value: '...' }]`
        findings.push(
          err(
            'INSTANCE_REQUIRED_VARIABLE_MISSING',
            `Element '${el.id}' is missing required variable '${v.id}'`,
            {
              path: `instance.elements[${ii}].variables`,
              fix_hint: `Add an entry { id: '${v.id}', value: ${fixShape} } to this element's variables.`,
            },
          ),
        )
      }
    }
  }

  return findings
}
