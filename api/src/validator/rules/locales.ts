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

  // Categories: name, description (required non-empty)
  for (const [ci, cat] of source.categories.entries()) {
    check(cat.name, `categories[${ci}].name`, 'name')
    check(cat.description, `categories[${ci}].description`, 'description')
    if (cat.context) {
      check(cat.context.name, `categories[${ci}].context.name`, 'context.name')
      check(cat.context.description, `categories[${ci}].context.description`, 'context.description')
      for (const [vi, cv] of cat.context.values.entries()) {
        check(cv.name, `categories[${ci}].context.values[${vi}].name`, 'context value name')
        check(
          cv.description,
          `categories[${ci}].context.values[${vi}].description`,
          'context value description',
        )
      }
    }
  }

  // Elements: title, description (required non-empty); alt_text (required non-empty)
  for (const [ei, el] of source.elements.entries()) {
    check(el.title, `elements[${ei}].title`, 'title')
    check(el.description, `elements[${ei}].description`, 'description')
    check(el.icon.alt_text, `elements[${ei}].icon.alt_text`, 'icon.alt_text')
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

  return findings
}
