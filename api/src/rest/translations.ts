import type { LocaleCode } from '../schema/locale.ts'
import type { SchemaManifest } from '../schema/manifest.ts'
import type {
  EmittedTranslationStatus,
  TranslationStatus,
} from '../schema/translation-status.ts'

/** Source locale assumed for versions that record no translation status. */
const DEFAULT_SOURCE_LOCALE: LocaleCode = 'en'

export const FLAG_STATUS_FILTERS = ['open', 'resolved', 'wontfix', 'all'] as const
export type FlagStatusFilter = (typeof FLAG_STATUS_FILTERS)[number]
export const DEFAULT_FLAG_STATUS: FlagStatusFilter = 'open'

export function isFlagStatusFilter(value: string): value is FlagStatusFilter {
  return (FLAG_STATUS_FILTERS as readonly string[]).includes(value)
}

type RecordedLocale = TranslationStatus['locales'][number]
type EmittedFlag = EmittedTranslationStatus['flags'][number]

export interface TranslationLocaleSummary {
  locale: LocaleCode
  /** `source` marks the canonical locale the others are translated from. */
  status: RecordedLocale['status'] | 'source'
  register?: string
  translated_by?: string
  reviewed_by?: string
  /** `null` when nothing is recorded for the locale. */
  updated_at: string | null
  summary: string
  /** Counts every flag for the locale, whatever `flag_status` selects. */
  flag_counts: Record<EmittedFlag['status'], number>
}

export interface TranslationsPayload {
  version: string
  source_locale: LocaleCode
  locales: TranslationLocaleSummary[]
  flags: EmittedFlag[]
}

/**
 * Shape a version's translation status for the REST route and the
 * `get_translation_status` MCP tool.
 *
 * `locales` follows `manifest.locales`, so a locale the status file
 * does not record (or a version with no status file at all) still
 * appears, as `unverified`.
 */
export function buildTranslationsPayload(
  manifest: SchemaManifest,
  status: EmittedTranslationStatus | null,
  filter: { locales: Set<LocaleCode> | null; flagStatus: FlagStatusFilter },
): TranslationsPayload {
  const sourceLocale = status?.source_locale ?? DEFAULT_SOURCE_LOCALE
  const allFlags = status?.flags ?? []
  const recorded = new Map((status?.locales ?? []).map((entry) => [entry.locale, entry] as const))
  const selected = (locale: LocaleCode) => !filter.locales || filter.locales.has(locale)

  const locales = manifest.locales.filter(selected).map((locale): TranslationLocaleSummary => {
    const flag_counts = { open: 0, resolved: 0, wontfix: 0 }
    for (const flag of allFlags) if (flag.locale === locale) flag_counts[flag.status]++
    if (locale === sourceLocale) {
      return { locale, status: 'source', updated_at: null, summary: '', flag_counts }
    }
    const entry = recorded.get(locale)
    if (!entry) return { locale, status: 'unverified', updated_at: null, summary: '', flag_counts }
    return { ...entry, flag_counts }
  })

  const flags = allFlags.filter(
    (flag) =>
      selected(flag.locale) && (filter.flagStatus === 'all' || flag.status === filter.flagStatus),
  )

  return { version: manifest.version, source_locale: sourceLocale, locales, flags }
}
