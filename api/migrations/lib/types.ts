import type { LocaleCode } from '../../src/schema/locale.ts'

export const MIGRATION_LOCALES: LocaleCode[] = ['en', 'es', 'fr', 'km', 'pt', 'tl']

/**
 * Opaque in-memory representation of a v1 element frontmatter across
 * all 6 locales (keyed by locale → Record<string, unknown>). null means
 * the file was missing or had no parseable frontmatter.
 */
export type LocaleBundle = Partial<Record<LocaleCode, Record<string, unknown> | null>>

/** Warning surfaced by the migration for post-run review. */
export interface MigrationWarning {
  code: string
  filename: string
  message: string
}
