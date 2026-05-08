import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'
import type { LocaleValue } from '../../schema/locale.ts'

/**
 * Rule 11: All `locale` fields are from the schema version's supported locales.
 * Rule 12: Each localized-string field has at least one entry.
 *
 * Rule 11 is partly caught by Zod's locale enum, but we also enforce
 * it at the semantic layer so (a) the error shape is consistent across
 * layers and (b) versions that later widen the enum but whose
 * manifest.locales stays narrower are still caught.
 */
export function checkLocales(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  const allowed = new Set(source.manifest.locales)

  const check = (values: LocaleValue[] | undefined, path: string, fieldName: string) => {
    if (!values || values.length === 0) {
      findings.push(
        err(
          'LOCALE_FIELD_EMPTY',
          `Required localized field '${fieldName}' at ${path} has no entries`,
          {
            path,
            fix_hint: `Add at least one locale entry (English is canonical).`,
          },
        ),
      )
      return
    }
    for (const [i, v] of values.entries()) {
      if (!allowed.has(v.locale as (typeof source.manifest.locales)[number])) {
        findings.push(
          err('LOCALE_NOT_ALLOWED', `Locale '${v.locale}' not in manifest allow-list`, {
            path: `${path}[${i}].locale`,
            fix_hint: `Use one of [${[...allowed].join(', ')}] or add '${v.locale}' to manifest.locales.`,
          }),
        )
      }
    }
  }

  // Optional localized field — only validate locale membership when entries exist.
  const checkOptional = (values: LocaleValue[] | undefined, path: string) => {
    if (!values || values.length === 0) return
    for (const [i, v] of values.entries()) {
      if (!allowed.has(v.locale as (typeof source.manifest.locales)[number])) {
        findings.push(
          err('LOCALE_NOT_ALLOWED', `Locale '${v.locale}' not in manifest allow-list`, {
            path: `${path}[${i}].locale`,
            fix_hint: `Use one of [${[...allowed].join(', ')}] or add '${v.locale}' to manifest.locales.`,
          }),
        )
      }
    }
  }

  // Categories: name, description (required non-empty); prompt/authoring_guidance/examples (optional locale check)
  for (const [ci, cat] of source.categories.entries()) {
    check(cat.name, `categories[${ci}].name`, 'name')
    check(cat.description, `categories[${ci}].description`, 'description')
    checkOptional(cat.prompt, `categories[${ci}].prompt`)
    checkOptional(cat.authoring_guidance, `categories[${ci}].authoring_guidance`)
    for (const [exi, ex] of cat.examples.entries()) {
      checkOptional(ex.scenario, `categories[${ci}].examples[${exi}].scenario`)
      checkOptional(ex.narrative, `categories[${ci}].examples[${exi}].narrative`)
    }
    if (cat.element_context) {
      check(
        cat.element_context.name,
        `categories[${ci}].element_context.name`,
        'element_context.name',
      )
      check(
        cat.element_context.description,
        `categories[${ci}].element_context.description`,
        'element_context.description',
      )
      for (const [vi, cv] of cat.element_context.values.entries()) {
        check(
          cv.name,
          `categories[${ci}].element_context.values[${vi}].name`,
          'element_context value name',
        )
        check(
          cv.description,
          `categories[${ci}].element_context.values[${vi}].description`,
          'element_context value description',
        )
      }
    }
  }

  // Elements: title, description (required non-empty);
  // authoring_guidance/examples (optional locale check); element-level
  // context (optional override) localized strings.
  for (const [ei, el] of source.elements.entries()) {
    check(el.title, `elements[${ei}].title`, 'title')
    check(el.description, `elements[${ei}].description`, 'description')
    checkOptional(el.authoring_guidance, `elements[${ei}].authoring_guidance`)
    for (const [exi, ex] of el.examples.entries()) {
      checkOptional(ex.scenario, `elements[${ei}].examples[${exi}].scenario`)
      checkOptional(ex.narrative, `elements[${ei}].examples[${exi}].narrative`)
    }
    if (el.context) {
      check(el.context.name, `elements[${ei}].context.name`, 'context.name')
      check(el.context.description, `elements[${ei}].context.description`, 'context.description')
      for (const [vi, cv] of el.context.values.entries()) {
        check(cv.name, `elements[${ei}].context.values[${vi}].name`, 'context value name')
        check(
          cv.description,
          `elements[${ei}].context.values[${vi}].description`,
          'context value description',
        )
      }
    }
  }

  // Datachain type name (required non-empty); description optional so only check locale membership if present
  check(source.datachainType.name, `datachainType.name`, 'name')
  for (const [i, v] of source.datachainType.description.entries()) {
    if (!allowed.has(v.locale as (typeof source.manifest.locales)[number])) {
      findings.push(
        err('LOCALE_NOT_ALLOWED', `Locale '${v.locale}' not in manifest allow-list`, {
          path: `datachainType.description[${i}].locale`,
        }),
      )
    }
  }

  // Datachain type subchains: name (required non-empty)
  for (const [si, sub] of source.datachainType.subchains.entries()) {
    check(sub.name, `datachainType.subchains[${si}].name`, 'subchain.name')
  }

  return findings
}
