// The v1 → 2026-04-16 port reads frontmatter for all six locales the
// `dtpr.io/api/dtpr/v1` content set ships (en, es, fr, km, pt, tl).
// The current schema's `LocaleCodeSchema` is narrower (en + fr) — the
// migration intentionally stays decoupled so it can keep operating on
// the historical 6-locale source set without forcing those codes back
// into the type-level allow-list.

export const MIGRATION_LOCALES: readonly string[] = [
  'en',
  'es',
  'fr',
  'km',
  'pt',
  'tl',
]

/**
 * Opaque in-memory representation of a v1 element frontmatter across
 * the historical six locales (keyed by locale → Record<string,
 * unknown>). null means the file was missing or had no parseable
 * frontmatter.
 */
export type LocaleBundle = Partial<Record<string, Record<string, unknown> | null>>

/** Warning surfaced by the migration for post-run review. */
export interface MigrationWarning {
  code: string
  filename: string
  message: string
}
