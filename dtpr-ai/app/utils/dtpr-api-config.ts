// Framework-light constants for the public DTPR API. Lives outside
// `useDtprState` so non-Nuxt callers (Vitest unit tests, plain helpers
// without a Vue runtime) can import without dragging in `vue` /
// composables. `useDtprState` re-exports the same values for the
// existing import sites.
// `VITE_DTPR_API_BASE` points local review at a `wrangler dev` API
// (e.g. http://localhost:8787/api/v2) seeded with an unpublished
// schema version. Statically replaced by Vite; production builds
// without the var keep the public API.
export const DTPR_API_BASE = import.meta.env?.VITE_DTPR_API_BASE ?? 'https://api.dtpr.io/api/v2'
export const DTPR_FETCH_TIMEOUT_MS = 8000
// `dtpr` is the consolidated type (dtpr@2026-09-01-beta onward); `ai`
// covers the earlier versions still in the index. One selector shows
// the whole lineage across the rename.
export const DTPR_DATACHAIN_TYPES = ['dtpr', 'ai'] as const
