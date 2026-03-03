import { readFile, readdir } from 'fs/promises'
import { join, basename } from 'path'
import matter from 'gray-matter'
import type {
  Collection,
  Locale,
  ParsedFile,
  ElementFrontmatter,
  CategoryFrontmatter,
  DatachainTypeFrontmatter,
  ElementSummary,
  CategorySummary,
  QueryFilters,
  ContentProvider,
} from './types'
import { LOCALES } from './types'

export class LocalContentProvider implements ContentProvider {
  // Cache: collection -> id -> fileName (built from English, shared across locales since filenames are the same)
  private idToFileCache = new Map<string, Map<string, string>>()

  constructor(
    private contentDir: string,
    private iconsDir: string,
  ) {}

  async readFile(collection: Collection, locale: Locale, id: string): Promise<ParsedFile> {
    // Try cache first
    const cacheKey = collection
    let cache = this.idToFileCache.get(cacheKey)
    if (cache?.has(id)) {
      return this.parseFile(collection, locale, cache.get(id)!)
    }

    // Build cache for this collection from English files
    if (!cache) {
      cache = new Map()
      const files = await this.listFilesInDir(collection, 'en')
      for (const f of files) {
        const parsed = await this.parseFile(collection, 'en', f)
        cache.set(parsed.frontmatter.id, f)
      }
      this.idToFileCache.set(cacheKey, cache)
    }

    const fileName = cache.get(id)
    if (!fileName) throw new Error(`File not found: ${collection}/${locale}/${id}`)
    return this.parseFile(collection, locale, fileName)
  }

  async writeFile(
    _collection: Collection,
    _locale: Locale,
    _id: string,
    _data: Record<string, any>,
    _content?: string,
  ): Promise<void> {
    throw new Error('Use content-writer.ts for write operations')
  }

  async listFiles(collection: Collection, locale?: Locale): Promise<string[]> {
    const locales = locale ? [locale] : LOCALES
    const results: string[] = []
    for (const loc of locales) {
      const files = await this.listFilesInDir(collection, loc as Locale)
      results.push(...files.map((f) => `${loc}/${f}`))
    }
    return results
  }

  async query<T = Record<string, any>>(
    collection: Collection,
    filters?: QueryFilters,
  ): Promise<ParsedFile<T>[]> {
    const locales = filters?.locale ? [filters.locale] : (LOCALES as readonly Locale[])
    const results: ParsedFile<T>[] = []

    for (const locale of locales) {
      const files = await this.listFilesInDir(collection, locale)
      for (const file of files) {
        const parsed = await this.parseFile(collection, locale, file)
        if (this.matchesFilters(parsed, filters)) {
          results.push(parsed as ParsedFile<T>)
        }
      }
    }
    return results
  }

  // Higher-level helpers

  async getAllElements(locale?: Locale): Promise<ParsedFile<ElementFrontmatter>[]> {
    return this.query<ElementFrontmatter>('elements', { locale })
  }

  async getAllCategories(locale?: Locale): Promise<ParsedFile<CategoryFrontmatter>[]> {
    return this.query<CategoryFrontmatter>('categories', { locale })
  }

  async getAllDatachainTypes(locale?: Locale): Promise<ParsedFile<DatachainTypeFrontmatter>[]> {
    return this.query<DatachainTypeFrontmatter>('datachain_types', { locale })
  }

  async getElementSummaries(): Promise<ElementSummary[]> {
    const enElements = await this.getAllElements('en')
    const summaries: ElementSummary[] = []

    for (const el of enElements) {
      const summary: ElementSummary = {
        id: el.frontmatter.id,
        category: el.frontmatter.category,
        icon: el.frontmatter.icon,
        locales: { en: { name: el.frontmatter.name, description: el.frontmatter.description } },
        updated_at: el.frontmatter.updated_at,
        fileName: basename(el.filePath),
      }

      // Load other locales
      for (const locale of LOCALES) {
        if (locale === 'en') continue
        try {
          const locFile = await this.parseFile(
            'elements',
            locale,
            basename(el.filePath),
          )
          summary.locales[locale] = {
            name: locFile.frontmatter.name,
            description: locFile.frontmatter.description,
          }
        } catch {
          // Missing translation
        }
      }

      summaries.push(summary)
    }
    return summaries
  }

  async getCategorySummaries(): Promise<CategorySummary[]> {
    const enCategories = await this.getAllCategories('en')
    const enElements = await this.getAllElements('en')
    const summaries: CategorySummary[] = []

    for (const cat of enCategories) {
      const elementCount = enElements.filter((el) =>
        el.frontmatter.category.includes(cat.frontmatter.id),
      ).length

      const summary: CategorySummary = {
        id: cat.frontmatter.id,
        datachain_type: cat.frontmatter.datachain_type,
        order: cat.frontmatter.order,
        required: cat.frontmatter.required,
        element_variables: cat.frontmatter.element_variables,
        locales: {
          en: {
            name: cat.frontmatter.name,
            description: cat.frontmatter.description,
            prompt: cat.frontmatter.prompt,
          },
        },
        updated_at: cat.frontmatter.updated_at,
        elementCount,
      }

      for (const locale of LOCALES) {
        if (locale === 'en') continue
        try {
          const locFile = await this.parseFile(
            'categories',
            locale,
            basename(cat.filePath),
          )
          summary.locales[locale] = {
            name: locFile.frontmatter.name,
            description: locFile.frontmatter.description,
            prompt: locFile.frontmatter.prompt,
          }
        } catch {
          // Missing translation
        }
      }

      summaries.push(summary)
    }
    return summaries
  }

  async listIcons(): Promise<string[]> {
    try {
      const files = await readdir(this.iconsDir)
      return files.filter((f) => f.endsWith('.svg'))
    } catch {
      return []
    }
  }

  // Internal helpers

  private collectionPath(collection: Collection, locale: Locale): string {
    return join(this.contentDir, collection, locale)
  }

  private async listFilesInDir(collection: Collection, locale: Locale): Promise<string[]> {
    try {
      const dir = this.collectionPath(collection, locale)
      const files = await readdir(dir)
      return files.filter((f) => f.endsWith('.md'))
    } catch {
      return []
    }
  }

  private async parseFile(
    collection: Collection,
    locale: Locale,
    fileName: string,
  ): Promise<ParsedFile> {
    const filePath = join(this.collectionPath(collection, locale), fileName)
    const raw = await readFile(filePath, 'utf-8')
    const { data, content } = matter(raw)
    return {
      frontmatter: data as Record<string, any>,
      content: content.trim(),
      filePath,
      locale,
      collection,
    }
  }

  private matchesFilters(parsed: ParsedFile, filters?: QueryFilters): boolean {
    if (!filters) return true
    const fm = parsed.frontmatter

    if (filters.category && fm.category && !fm.category.includes(filters.category)) {
      return false
    }
    if (filters.datachain_type && fm.datachain_type !== filters.datachain_type) {
      return false
    }
    if (filters.search) {
      const term = filters.search.toLowerCase()
      const searchable = `${fm.name || ''} ${fm.description || ''} ${fm.id || ''}`.toLowerCase()
      if (!searchable.includes(term)) return false
    }
    if (filters.hasIcon !== undefined) {
      const hasIcon = !!fm.icon
      if (filters.hasIcon !== hasIcon) return false
    }
    return true
  }
}
