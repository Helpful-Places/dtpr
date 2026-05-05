// Shared locale + version state for DTPR-derived surfaces (the catalog,
// element pages, category pages, and the synthetic Cmd-K group). Reads
// `?v=` and `?locale=` query params from the active route, exposes the
// resolved active values, and surfaces writable computeds that push to
// the router via `replace` (preserving back-button behavior).
//
// Scope: this is NOT a general-purpose i18n layer for the docus prose
// shell. Docus stays English-only at the site level; locale awareness
// here applies only to schema-derived content (titles, descriptions,
// variable labels, context value names). Future migration to docus's
// `[[lang]]/...` route prefix is a clean redirect-and-migrate when the
// prose translation pipeline lands.
import { computed } from 'vue'

const API_BASE = 'https://api.dtpr.io/api/v2'
const DATACHAIN_TYPE = 'ai'
const FETCH_TIMEOUT_MS = 8000

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'km', 'pt', 'tl'] as const

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

  const latestVersion = computed(() => availableVersions.value[0]?.id ?? `${DATACHAIN_TYPE}@latest`)

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

  const requestedLocale = computed(() => {
    const raw = route.query.locale
    if (typeof raw !== 'string' || raw.length === 0) return null
    return raw
  })

  const activeLocale = computed<SupportedLocale>(() => {
    const r = requestedLocale.value
    if (r && isSupportedLocale(r)) return r
    return 'en'
  })

  const selectedVersion = computed<string>({
    get: () => activeVersion.value,
    set: (next: string) => {
      if (!next || next === activeVersion.value) return
      router.replace({ query: { ...route.query, v: next }, hash: route.hash })
    },
  })

  const selectedLocale = computed<SupportedLocale>({
    get: () => activeLocale.value,
    set: (next: SupportedLocale) => {
      if (!next || next === activeLocale.value) return
      // Strip back to default rather than carrying `?locale=en` in URLs.
      const query = { ...route.query }
      if (next === 'en') delete query.locale
      else query.locale = next
      router.replace({ query, hash: route.hash })
    },
  })

  const availableLocales = computed(() => SUPPORTED_LOCALES.slice())

  return {
    activeVersion,
    activeLocale,
    selectedVersion,
    selectedLocale,
    requestedVersion,
    versionMissing,
    latestVersion,
    availableVersions,
    availableLocales,
  }
}

export const DTPR_API_BASE = API_BASE
export const DTPR_FETCH_TIMEOUT_MS = FETCH_TIMEOUT_MS
export const DTPR_DATACHAIN_TYPE = DATACHAIN_TYPE
export { SUPPORTED_LOCALES }
