import type { LocationQueryRaw } from 'vue-router'

// The taxonomy for the schema version and locale in the URL (?v=, ?locale=),
// with helpers bound to them. Await it at the top of a page's setup.
export async function useTaxonomy() {
  const route = useRoute()
  const v = computed(() => route.query.v as string | undefined)
  const localeParam = computed(() => route.query.locale as string | undefined)

  const { data, error, refresh } = await useFetch<DtprTaxonomy>('/api/taxonomy', {
    query: { v, locale: localeParam },
  })

  const taxonomy = computed(() => data.value)
  const version = computed(() => data.value?.version.id ?? '')
  const locale = computed(() => data.value?.locale ?? DTPR_SOURCE_LOCALE)

  const categoryById = computed(() => new Map((data.value?.categories ?? []).map((c) => [c.id, c])))
  const elementById = computed(() => new Map((data.value?.elements ?? []).map((e) => [e.id, e])))
  const elementsByCategory = computed(() => {
    const out = new Map<string, DtprElement[]>()
    for (const e of data.value?.elements ?? []) {
      if (!out.has(e.category_id)) out.set(e.category_id, [])
      out.get(e.category_id)!.push(e)
    }
    return out
  })

  // How far the current locale's text has been reviewed.
  const translation = computed(() => data.value?.translations.find((l) => l.locale === locale.value))

  const t = (values: DtprLocalized[] | undefined) => dtprText(values, locale.value)
  const icon = (element: DtprElement, contextValueId?: string | null, dark = false) =>
    dtprIconUrl(version.value, element.id, dtprIconVariant(element, contextValueId, dark))

  // Links inside the taxonomy keep the chosen version and locale.
  const to = (path: string, query: LocationQueryRaw = {}) => ({
    path,
    query: { v: v.value, locale: localeParam.value, ...query },
  })

  return { taxonomy, error, refresh, version, locale, translation, categoryById, elementById, elementsByCategory, t, icon, to }
}

export type TaxonomyContext = Awaited<ReturnType<typeof useTaxonomy>>

const LOCALE_NAMES: Record<string, string> = { 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文' }

/** A locale's own name for itself, e.g. "Français". */
export function dtprLocaleName(locale: string): string {
  if (LOCALE_NAMES[locale]) return LOCALE_NAMES[locale]
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale)
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : locale
  }
  catch {
    return locale
  }
}

const TAXONOMY_KEY = Symbol('taxonomy') as InjectionKey<TaxonomyContext>
export const provideTaxonomy = (context: TaxonomyContext) => provide(TAXONOMY_KEY, context)
export const useTaxonomyContext = () => inject(TAXONOMY_KEY)!
