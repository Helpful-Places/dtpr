import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err, warn } from '../types.ts'
import { isMultiSelectEnumVariable, type Variable } from '../../schema/variable.ts'

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
 * Rule 19: multi_select_enum vocabulary integrity — option ids unique;
 * each option.applies_to id is an element in the same category;
 * required + empty-options is a warning.
 */
export function checkVariables(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  const categoryById = new Map(source.categories.map((c) => [c.id, c] as const))

  // Rule 19: multi_select_enum vocabulary integrity, per category.
  const elementsByCategory = new Map<string, Set<string>>()
  for (const el of source.elements) {
    const set = elementsByCategory.get(el.category_id) ?? new Set<string>()
    set.add(el.id)
    elementsByCategory.set(el.category_id, set)
  }
  for (const [ci, cat] of source.categories.entries()) {
    for (const [vi, variable] of cat.element_variables.entries()) {
      if (!isMultiSelectEnumVariable(variable)) continue
      const localElementIds = elementsByCategory.get(cat.id) ?? new Set<string>()
      const seenOptionIds = new Map<string, number>()
      for (const [oi, opt] of variable.options.entries()) {
        const prev = seenOptionIds.get(opt.id)
        if (prev !== undefined) {
          findings.push(
            err(
              'VARIABLE_OPTION_DUPLICATE',
              `Duplicate option id '${opt.id}' on variable '${variable.id}' of category '${cat.id}'`,
              {
                path: `categories[${ci}].element_variables[${vi}].options[${oi}].id`,
                fix_hint: `Rename or remove the duplicate (first seen at index ${prev}).`,
              },
            ),
          )
        } else {
          seenOptionIds.set(opt.id, oi)
        }
        for (const [ai, parentId] of opt.applies_to.entries()) {
          if (!localElementIds.has(parentId)) {
            findings.push(
              err(
                'VARIABLE_OPTION_APPLIES_TO_UNKNOWN',
                `Option '${opt.id}' of variable '${variable.id}' (category '${cat.id}') applies_to references unknown element '${parentId}'`,
                {
                  path: `categories[${ci}].element_variables[${vi}].options[${oi}].applies_to[${ai}]`,
                  fix_hint: `applies_to must reference an element_id whose category_id is '${cat.id}'.`,
                },
              ),
            )
          }
        }
      }
      if (variable.options.length === 0) {
        findings.push(
          warn(
            'VARIABLE_OPTIONS_EMPTY',
            `multi_select_enum variable '${variable.id}' on category '${cat.id}' has no options — vocabulary declared but unauthored`,
            {
              path: `categories[${ci}].element_variables[${vi}].options`,
              fix_hint: `Author at least one option, or remove the variable until ready.`,
            },
          ),
        )
        if (variable.required) {
          findings.push(
            err(
              'VARIABLE_REQUIRED_EMPTY_OPTIONS',
              `Required multi_select_enum variable '${variable.id}' on category '${cat.id}' has no options — instances cannot satisfy it`,
              {
                path: `categories[${ci}].element_variables[${vi}]`,
                fix_hint: `Either add options, or set required: false until the vocabulary is authored.`,
              },
            ),
          )
        }
      }
    }
  }

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
