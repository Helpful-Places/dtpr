export const LOCALES = ['en', 'es', 'fr', 'km', 'pt', 'tl'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export type DatachainType = 'ai' | 'device'
export type Collection = 'elements' | 'categories' | 'datachain_types'

// Raw frontmatter as parsed from markdown files (uses `id`, not `dtpr_id`)
export interface ElementFrontmatter {
  id: string
  name: string
  description: string
  category: string[]
  icon: string
  updated_at: string
}

export interface CategoryFrontmatter {
  id: string
  name: string
  description: string
  prompt?: string
  required?: boolean
  order?: number
  datachain_type: DatachainType
  element_variables?: ElementVariable[]
  updated_at: string
}

export interface DatachainTypeFrontmatter {
  id: string
  name: string
}

export interface ElementVariable {
  id: string
  label?: string
  required?: boolean
}

// Parsed file with metadata
export interface ParsedFile<T = Record<string, any>> {
  frontmatter: T
  content: string // markdown body (usually empty for DTPR)
  filePath: string
  locale: Locale
  collection: Collection
}

// Aggregated element across locales
export interface ElementSummary {
  id: string
  category: string[]
  icon: string
  locales: Record<string, { name: string; description: string }>
  updated_at: string
  fileName: string
}

// Aggregated category across locales
export interface CategorySummary {
  id: string
  datachain_type: DatachainType
  order?: number
  required?: boolean
  element_variables?: ElementVariable[]
  locales: Record<string, { name: string; description: string; prompt?: string }>
  updated_at: string
  elementCount: number
}

// Gap analysis types
export interface GapReport {
  summary: GapSummary
  missingTranslations: MissingTranslation[]
  missingIcons: string[]
  staleTranslations: StaleTranslation[]
  sparseCategories: SparseCategory[]
  orphanedElements: OrphanedElement[]
  validationErrors: ValidationError[]
}

export interface GapSummary {
  totalElements: number
  totalCategories: number
  totalLocales: number
  totalIcons: number
  missingTranslationCount: number
  missingIconCount: number
  staleTranslationCount: number
  validationErrorCount: number
}

export interface MissingTranslation {
  elementId: string
  collection: Collection
  missingLocales: Locale[]
}

export interface StaleTranslation {
  elementId: string
  collection: Collection
  locale: Locale
  sourceUpdatedAt: string
  translationUpdatedAt: string
}

export interface SparseCategory {
  categoryId: string
  elementCount: number
  medianCount: number
}

export interface OrphanedElement {
  elementId: string
  referencedCategory: string
  fileName: string
}

export interface ValidationError {
  file: string
  field: string
  message: string
}

// ContentProvider interface for future extensibility
export interface ContentProvider {
  readFile(collection: Collection, locale: Locale, id: string): Promise<ParsedFile>
  writeFile(collection: Collection, locale: Locale, id: string, data: Record<string, any>, content?: string): Promise<void>
  listFiles(collection: Collection, locale?: Locale): Promise<string[]>
  query<T = Record<string, any>>(collection: Collection, filters?: QueryFilters): Promise<ParsedFile<T>[]>
}

export interface QueryFilters {
  locale?: Locale
  category?: string
  datachain_type?: DatachainType
  search?: string
  hasIcon?: boolean
}
