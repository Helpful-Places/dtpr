// Framework-light constants for the public DTPR API. Lives outside
// `useDtprState` so non-Nuxt callers (Vitest unit tests, plain helpers
// without a Vue runtime) can import without dragging in `vue` /
// composables. `useDtprState` re-exports the same values for the
// existing import sites.
export const DTPR_API_BASE = 'https://api.dtpr.io/api/v2'
export const DTPR_FETCH_TIMEOUT_MS = 8000
export const DTPR_DATACHAIN_TYPE = 'ai'
