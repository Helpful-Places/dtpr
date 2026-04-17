import { z } from 'zod'

/**
 * Locales supported by DTPR content. Initial port (2026-04-16) supports
 * the six locales already served by `dtpr.io/api/dtpr/v1`.
 */
export const LocaleCodeSchema = z
  .enum(['en', 'es', 'fr', 'km', 'pt', 'tl'])
  .describe('ISO locale code from the schema version allow-list')

export type LocaleCode = z.infer<typeof LocaleCodeSchema>

/**
 * A single (locale, value) entry. Every user-facing string in DTPR content
 * is represented as an array of these so a consumer can pick the locale
 * they need. Empty arrays are rejected at the semantic-validation layer
 * (rule #12), not by Zod, so the CLI can emit a friendlier error.
 */
export const LocaleValueSchema = z
  .object({
    locale: LocaleCodeSchema,
    value: z.string().describe('Localized string value'),
  })
  .describe('A localized string entry: (locale, value)')

export type LocaleValue = z.infer<typeof LocaleValueSchema>

/**
 * An ordered list of LocaleValue entries. English is treated as the
 * canonical source; semantic rule #12 requires at least one entry.
 */
export const LocaleValueArraySchema = z
  .array(LocaleValueSchema)
  .describe('List of localized string entries. At least one required (enforced semantically).')
