import { z } from 'zod'

/**
 * Locales the DTPR Zod layer recognizes. This is the *type-level*
 * allow-list; each schema version additionally constrains it via its
 * own `manifest.locales` (semantic rule 11), which is the
 * per-version contract production schemas operate against. Current
 * production manifests narrow this to `['en', 'fr']`; historical
 * fixtures and tests still exercise the full enum so the validator
 * stays generic and a future schema version can re-introduce a
 * dropped locale just by listing it in its manifest.
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
