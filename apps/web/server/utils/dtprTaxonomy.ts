import type { H3Event } from 'h3'

// Server-side reads from the DTPR API, cached for an hour. Beta schema versions
// change without notice, so nothing is stored at build time. A stale copy keeps
// being served if the API is slow or down.
const CACHE = { maxAge: 60 * 60, swr: true, staleMaxAge: -1 } as const

const dtprFetch = <T>(path: string) =>
  $fetch<T>(`${DTPR_API_BASE}${path}`, { headers: { 'DTPR-Client': 'dtpr-website/1' }, timeout: 8000 })

export const getDtprVersions = defineCachedFunction(
  async (_event: H3Event) => {
    const { versions } = await dtprFetch<{ versions: DtprSchemaVersion[] }>('/schemas')
    return dtprSortVersions(versions.filter((v) => v.id.startsWith(`${DTPR_DATACHAIN_TYPE}@`)))
  },
  { ...CACHE, name: 'dtpr-versions', getKey: () => 'all' },
)

export const getDtprLocales = defineCachedFunction(
  async (_event: H3Event, version: string) => {
    const { manifest } = await dtprFetch<{ manifest: { locales: string[] } }>(`/schemas/${encodeURIComponent(version)}/manifest`)
    return manifest.locales
  },
  { ...CACHE, name: 'dtpr-locales', getKey: (_event, version) => version },
)

export const getDtprContent = defineCachedFunction(
  async (_event: H3Event, version: string, locale: string) => {
    const base = `/schemas/${encodeURIComponent(version)}`
    // English rides along so untranslated strings have a fallback.
    const locales = [...new Set([locale, DTPR_SOURCE_LOCALE])].join(',')
    const { categories } = await dtprFetch<{ categories: DtprCategory[] }>(`${base}/categories?locales=${locales}`)

    // The list endpoint returns at most 200 elements per page.
    const elements: DtprElement[] = []
    let cursor: string | null = null
    do {
      const page: { elements: DtprElement[], meta: { next_cursor: string | null } } = await dtprFetch(
        `${base}/elements?locales=${locales}&fields=all&limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      )
      elements.push(...page.elements)
      cursor = page.meta.next_cursor
    } while (cursor)

    return { categories: [...categories].sort((a, b) => a.order - b.order), elements }
  },
  { ...CACHE, name: 'dtpr-content', getKey: (_event, version, locale) => `${version}:${locale}` },
)

export const getDtprTranslations = defineCachedFunction(
  async (_event: H3Event, version: string) => {
    const { source_locale, locales, flags } = await dtprFetch<DtprTranslations>(`/schemas/${encodeURIComponent(version)}/translations`)
    return { source_locale, locales, flags }
  },
  { ...CACHE, name: 'dtpr-translations', getKey: (_event, version) => version },
)

/** The taxonomy for a requested version and locale, falling back to the default of each. */
export async function getDtprTaxonomy(event: H3Event, requestedVersion?: string, requestedLocale?: string): Promise<DtprTaxonomy> {
  const versions = await getDtprVersions(event)
  if (!versions.length) throw createError({ statusCode: 502, statusMessage: 'The DTPR API lists no schema versions' })
  const version = versions.find((v) => v.id === requestedVersion) ?? versions[0]!
  const locales = await getDtprLocales(event, version.id)
  const locale = requestedLocale && locales.includes(requestedLocale) ? requestedLocale : DTPR_SOURCE_LOCALE
  // Review status is extra: the taxonomy still loads if it cannot be fetched.
  const [content, translations] = await Promise.all([
    getDtprContent(event, version.id, locale),
    getDtprTranslations(event, version.id).then((t) => t.locales).catch(() => []),
  ])
  return {
    version,
    versions,
    ...(requestedVersion && requestedVersion !== version.id ? { missingVersion: requestedVersion } : {}),
    locale,
    locales,
    translations,
    ...content,
  }
}
