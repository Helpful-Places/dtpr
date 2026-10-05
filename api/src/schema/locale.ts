import { z } from 'zod'

/**
 * Locales the DTPR Zod layer recognizes. This is the *type-level*
 * allow-list; each schema version additionally constrains it via its
 * own `manifest.locales` (semantic rule 11), which is the
 * per-version contract production schemas operate against. Adding a
 * locale is a deliberate two-step: list it here, then add it to a
 * version's `manifest.locales` and ship translated content
 * (`schema:translate`).
 *
 * Codes are BCP 47. Filipino is `fil` (CLDR canonicalizes the legacy
 * `tl` to it), and Chinese is tagged by script rather than region.
 *
 * The historical v1 → 2026-04-16 migration in `migrations/` deals
 * with a wider 6-locale source set; it types its locale codes as
 * plain strings to stay decoupled from this enum.
 */
export const LocaleCodeSchema = z
  .enum(['en', 'fr', 'es', 'pt', 'fil', 'km', 'vi', 'zh-Hans', 'zh-Hant'])
  .describe('BCP 47 locale code from the schema version allow-list')

export type LocaleCode = z.infer<typeof LocaleCodeSchema>

/**
 * Tags that name a supported locale under another code. `tl` is what
 * the legacy v0/v1 content used and what Firefox and Safari still send
 * for Filipino; region-tagged Chinese maps to its script.
 */
const LOCALE_ALIASES: Record<string, LocaleCode> = {
  tl: 'fil',
  zh: 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh-sg': 'zh-Hans',
  'zh-my': 'zh-Hans',
  'zh-tw': 'zh-Hant',
  'zh-hk': 'zh-Hant',
  'zh-mo': 'zh-Hant',
}

const LOCALE_BY_LOWERCASE = new Map(LocaleCodeSchema.options.map((code) => [code.toLowerCase(), code]))

/**
 * Resolve a BCP 47 tag as a client would send it (`tl`, `pt-BR`,
 * `zh-TW`, `ZH-hant-HK`) to the canonical code schema content is
 * stored under, or `null` when no supported locale matches. Content
 * itself only ever carries canonical codes; this is for request input.
 */
export function resolveLocaleCode(tag: string): LocaleCode | null {
  const subtags = tag.trim().toLowerCase().replace(/_/g, '-').split('-')
  // Longest prefix first, so `zh-hant-hk` finds `zh-hant` before `zh`.
  for (let n = subtags.length; n > 0; n--) {
    const prefix = subtags.slice(0, n).join('-')
    const code = LOCALE_BY_LOWERCASE.get(prefix) ?? LOCALE_ALIASES[prefix]
    if (code) return code
  }
  return null
}

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
