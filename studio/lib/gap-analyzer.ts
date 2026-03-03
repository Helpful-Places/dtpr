import { existsSync } from 'fs'
import { join, basename } from 'path'
import type { LocalContentProvider } from './content-reader'
import type {
  GapReport,
  GapSummary,
  MissingTranslation,
  StaleTranslation,
  SparseCategory,
  OrphanedElement,
  ValidationError,
  Locale,
  Collection,
} from './types'
import { LOCALES } from './types'

export async function analyzeGaps(
  provider: LocalContentProvider,
  iconsDir: string,
): Promise<GapReport> {
  const [
    missingTranslations,
    missingIcons,
    staleTranslations,
    sparseCategories,
    orphanedElements,
    validationErrors,
  ] = await Promise.all([
    findMissingTranslations(provider),
    findMissingIcons(provider, iconsDir),
    findStaleTranslations(provider),
    findSparseCategories(provider),
    findOrphanedElements(provider),
    findValidationErrors(provider),
  ])

  const icons = await provider.listIcons()

  const summary: GapSummary = {
    totalElements: (await provider.getAllElements('en')).length,
    totalCategories: (await provider.getAllCategories('en')).length,
    totalLocales: LOCALES.length,
    totalIcons: icons.length,
    missingTranslationCount: missingTranslations.reduce(
      (sum, mt) => sum + mt.missingLocales.length,
      0,
    ),
    missingIconCount: missingIcons.length,
    staleTranslationCount: staleTranslations.length,
    validationErrorCount: validationErrors.length,
  }

  return {
    summary,
    missingTranslations,
    missingIcons,
    staleTranslations,
    sparseCategories,
    orphanedElements,
    validationErrors,
  }
}

async function findMissingTranslations(
  provider: LocalContentProvider,
): Promise<MissingTranslation[]> {
  const results: MissingTranslation[] = []

  for (const collection of ['elements', 'categories', 'datachain_types'] as Collection[]) {
    const enFiles = await provider.listFiles(collection, 'en')
    const enFileNames = enFiles.map((f) => f.replace('en/', ''))

    for (const fileName of enFileNames) {
      const missingLocales: Locale[] = []
      for (const locale of LOCALES) {
        if (locale === 'en') continue
        const localeFiles = await provider.listFiles(collection, locale)
        const localeFileNames = localeFiles.map((f) => f.replace(`${locale}/`, ''))
        if (!localeFileNames.includes(fileName)) {
          missingLocales.push(locale)
        }
      }
      if (missingLocales.length > 0) {
        // Get the id from the English file
        const parsed = await provider.query('elements' as Collection, { locale: 'en' })
        const match = parsed.find((p) => basename(p.filePath) === fileName)
        results.push({
          elementId: match?.frontmatter.id || fileName.replace('.md', ''),
          collection,
          missingLocales,
        })
      }
    }
  }
  return results
}

async function findMissingIcons(
  provider: LocalContentProvider,
  iconsDir: string,
): Promise<string[]> {
  const elements = await provider.getAllElements('en')
  const missing: string[] = []

  for (const el of elements) {
    const iconPath = el.frontmatter.icon
    if (!iconPath) {
      missing.push(el.frontmatter.id)
      continue
    }
    // Icon path is like /dtpr-icons/foo.svg, resolve to filesystem
    const iconFile = join(iconsDir, basename(iconPath))
    if (!existsSync(iconFile)) {
      missing.push(el.frontmatter.id)
    }
  }
  return missing
}

async function findStaleTranslations(
  provider: LocalContentProvider,
): Promise<StaleTranslation[]> {
  const results: StaleTranslation[] = []

  for (const collection of ['elements', 'categories'] as Collection[]) {
    const enFiles =
      collection === 'elements'
        ? await provider.getAllElements('en')
        : await provider.getAllCategories('en')

    for (const enFile of enFiles) {
      const enUpdated = enFile.frontmatter.updated_at
      if (!enUpdated) continue

      for (const locale of LOCALES) {
        if (locale === 'en') continue
        try {
          const locFile = await provider.readFile(collection, locale, enFile.frontmatter.id)
          const locUpdated = locFile.frontmatter.updated_at
          if (locUpdated && new Date(enUpdated) > new Date(locUpdated)) {
            results.push({
              elementId: enFile.frontmatter.id,
              collection,
              locale,
              sourceUpdatedAt: enUpdated,
              translationUpdatedAt: locUpdated,
            })
          }
        } catch {
          // Missing translation — handled by findMissingTranslations
        }
      }
    }
  }
  return results
}

async function findSparseCategories(provider: LocalContentProvider): Promise<SparseCategory[]> {
  const categories = await provider.getAllCategories('en')
  const elements = await provider.getAllElements('en')

  const counts = categories.map((cat) => {
    const count = elements.filter((el) =>
      el.frontmatter.category.includes(cat.frontmatter.id),
    ).length
    return { categoryId: cat.frontmatter.id, elementCount: count }
  })

  const sorted = counts.map((c) => c.elementCount).sort((a, b) => a - b)
  const medianCount = sorted[Math.floor(sorted.length / 2)]

  // Categories with less than half the median count
  const threshold = Math.max(1, Math.floor(medianCount / 2))
  return counts
    .filter((c) => c.elementCount < threshold)
    .map((c) => ({ ...c, medianCount }))
}

async function findOrphanedElements(provider: LocalContentProvider): Promise<OrphanedElement[]> {
  const elements = await provider.getAllElements('en')
  const categories = await provider.getAllCategories('en')
  const categoryIds = new Set(categories.map((c) => c.frontmatter.id))
  const results: OrphanedElement[] = []

  for (const el of elements) {
    for (const catRef of el.frontmatter.category) {
      if (!categoryIds.has(catRef)) {
        results.push({
          elementId: el.frontmatter.id,
          referencedCategory: catRef,
          fileName: basename(el.filePath),
        })
      }
    }
  }
  return results
}

async function findValidationErrors(provider: LocalContentProvider): Promise<ValidationError[]> {
  const errors: ValidationError[] = []
  const elements = await provider.getAllElements('en')

  for (const el of elements) {
    const fm = el.frontmatter
    if (!fm.id) errors.push({ file: el.filePath, field: 'id', message: 'Missing required field: id' })
    if (!fm.name) errors.push({ file: el.filePath, field: 'name', message: 'Missing required field: name' })
    if (!fm.description) errors.push({ file: el.filePath, field: 'description', message: 'Missing required field: description' })
    if (!fm.category || fm.category.length === 0)
      errors.push({ file: el.filePath, field: 'category', message: 'Missing required field: category' })
  }

  const categories = await provider.getAllCategories('en')
  for (const cat of categories) {
    const fm = cat.frontmatter
    if (!fm.id) errors.push({ file: cat.filePath, field: 'id', message: 'Missing required field: id' })
    if (!fm.name) errors.push({ file: cat.filePath, field: 'name', message: 'Missing required field: name' })
    if (!fm.datachain_type)
      errors.push({ file: cat.filePath, field: 'datachain_type', message: 'Missing required field: datachain_type' })
  }

  return errors
}
