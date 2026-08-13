// Localization primitives, lifted from the v6 prototype's `t` / `tr`
// helpers. Canvas content is authored bilingually inline; the renderer
// resolves a locale at render time. No inflection happens here — the
// French fills are pre-agreed strings (v6 R17).

export type Loc = 'en' | 'fr'

/** A string authored in every supported locale. */
export interface Localized {
  en: string
  fr: string
}

/** Author a localized value: `t('Entry', 'Accès')`. */
export const t = (en: string, fr: string): Localized => ({ en, fr })

/** Resolve a localized value (or a plain/absent string) for a locale. */
export const tr = (v: Localized | string | null | undefined, loc: Loc): string => {
  if (v && typeof v === 'object' && 'en' in v) return v[loc]
  return v == null ? '' : v
}

/** Intl list formatter for a locale (conjunction: "a, b and c"). */
export const listF = (loc: Loc) => new Intl.ListFormat(loc, { type: 'conjunction' })

/** Compact number formatting: 2_300_000 → "2.3M". */
export const compact = (n: number, loc: Loc) =>
  new Intl.NumberFormat(loc, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
