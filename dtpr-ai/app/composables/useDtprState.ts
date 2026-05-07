// Shared locale + version state for DTPR-derived surfaces (the catalog,
// element pages, category pages, and the synthetic Cmd-K group).
//
// Locale is owned by `@nuxtjs/i18n` (configured via docus's i18n
// integration) and exposed here as a computed alias of `useI18n().locale`.
// Version still lives in `?v=` query — schema versions are an
// orthogonal axis to locale and don't need to be in the URL path.
//
// Schema-derived content (titles, descriptions, variable labels,
// context value names) translates from the route locale via the API's
// `locales=` query parameter. Docus prose remains English-only until
// translated `content/{locale}/` folders ship.
import { computed } from 'vue'

const API_BASE = 'https://api.dtpr.io/api/v2'
const DATACHAIN_TYPE = 'ai'
const FETCH_TIMEOUT_MS = 8000

// Route locales — narrowed to languages whose prose translations are
// (or are about to be) shipping. The schema itself may carry more
// locales; the API still returns them when asked, but for now only
// these are reachable via URL prefix and surfaced in the locale UI.
const SUPPORTED_LOCALES = ['en', 'fr'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export interface SchemaVersion {
  id: string
  status: 'stable' | 'beta'
  created_at: string
  content_hash: string
}

interface SchemasResponse {
  ok: boolean
  versions: SchemaVersion[]
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function useDtprState() {
  const route = useRoute()
  const router = useRouter()
  const { locale: i18nLocale } = useI18n()

  const { data: schemasData } = useFetch<SchemasResponse>(`${API_BASE}/schemas`, {
    key: 'dtpr-schemas-index',
    timeout: FETCH_TIMEOUT_MS,
  })

  const availableVersions = computed<SchemaVersion[]>(() => {
    const all = schemasData.value?.versions ?? []
    return all
      .filter((v) => v.id.startsWith(`${DATACHAIN_TYPE}@`))
      .slice()
      .sort((a, b) => {
        if (a.status === 'stable' && b.status !== 'stable') return -1
        if (a.status !== 'stable' && b.status === 'stable') return 1
        return b.created_at.localeCompare(a.created_at)
      })
  })

  // Empty string (not `${DATACHAIN_TYPE}@latest`) when the list isn't
  // resolved yet: the API rejects literal "latest" with a 400, and
  // every consumer gates category/element fetches on truthy
  // `activeVersion`, so an empty value cleanly skips the request until
  // the schemas fetch lands.
  const latestVersion = computed(() => availableVersions.value[0]?.id ?? '')

  const requestedVersion = computed(() => {
    const raw = route.query.v
    if (typeof raw !== 'string' || raw.length === 0) return null
    return raw
  })

  const versionMissing = computed(() => {
    const r = requestedVersion.value
    if (!r) return false
    if (availableVersions.value.length === 0) return false
    return !availableVersions.value.some((v) => v.id === r)
  })

  const activeVersion = computed(() => {
    const r = requestedVersion.value
    if (r && !versionMissing.value) return r
    return latestVersion.value
  })

  const activeLocale = computed<SupportedLocale>(() => {
    const r = i18nLocale.value
    if (typeof r === 'string' && isSupportedLocale(r)) return r
    return 'en'
  })

  const selectedVersion = computed<string>({
    get: () => activeVersion.value,
    set: (next: string) => {
      if (!next || next === activeVersion.value) return
      router.replace({ query: { ...route.query, v: next }, hash: route.hash })
    },
  })

  return {
    activeVersion,
    activeLocale,
    selectedVersion,
    requestedVersion,
    versionMissing,
    latestVersion,
    availableVersions,
  }
}

export const DTPR_API_BASE = API_BASE
export const DTPR_FETCH_TIMEOUT_MS = FETCH_TIMEOUT_MS
export const DTPR_DATACHAIN_TYPE = DATACHAIN_TYPE
export { SUPPORTED_LOCALES }
