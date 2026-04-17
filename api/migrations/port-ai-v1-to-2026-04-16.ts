#!/usr/bin/env -S tsx
/**
 * One-shot migration: AI content from `app/content/dtpr.v1/` (markdown
 * per-locale) → `api/schemas/ai/2026-04-16-beta/` (YAML per entity with
 * embedded locales).
 *
 * Field transformations (per plan Key Technical Decisions and R25/R26):
 *  - element `name` → `title` (trimmed)
 *  - element plural `category_ids` → singular `category_id`, first `ai__*` entry
 *  - Drop `updated_at` (R8), element-level `context_type_id` (R25b),
 *    legacy `icon:` block
 *  - Add `citation: []` to every element
 *  - v1 `symbol: /dtpr-icons/symbols/<name>.svg` → `symbol_id: <name>`
 *  - Categories keep `element_variables` as source; elements inherit at build
 *  - Categories get a `shape:` (hexagon/circle/rounded-square/octagon)
 *    from a static map mirroring `studio/lib/icon-shapes.ts`
 *  - Unique symbol SVGs are copied from `app/public/dtpr-icons/symbols/`
 *    into `<release>/symbols/`
 *  - Version tagged `ai@2026-04-16-beta` (port-as-beta per R26)
 *
 * Script is idempotent: the target dir is wiped before writing so
 * re-running from HEAD produces identical output (modulo running
 * schema:validate which checks no git diff).
 */

import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { validateCmd } from '../cli/commands/build.ts'
import { parseFrontmatter } from './lib/frontmatter.ts'
import { transformCategory } from './lib/transform-category.ts'
import { transformDatachainType } from './lib/transform-datachain.ts'
import { transformElement } from './lib/transform-element.ts'
import { MIGRATION_LOCALES, type LocaleBundle, type MigrationWarning } from './lib/types.ts'
import type { LocaleCode } from '../src/schema/locale.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const V1_CONTENT = join(REPO_ROOT, 'app', 'content', 'dtpr.v1')
const V1_SYMBOL_SOURCE_DIR = join(REPO_ROOT, 'app', 'public', 'dtpr-icons', 'symbols')
const OUT_ROOT = join(REPO_ROOT, 'api', 'schemas')
const VERSION_DIR = 'ai/2026-04-16-beta'

async function readLocaleBundle(
  subpath: string[],
  filename: string,
): Promise<LocaleBundle> {
  const bundle: LocaleBundle = {}
  for (const locale of MIGRATION_LOCALES) {
    const path = join(V1_CONTENT, ...subpath, locale, filename)
    try {
      const raw = await readFile(path, 'utf8')
      bundle[locale] = parseFrontmatter(raw)
    } catch {
      bundle[locale] = null
    }
  }
  return bundle
}

async function listAiCategoryFiles(): Promise<string[]> {
  const enDir = join(V1_CONTENT, 'categories', 'en')
  const entries = await readdir(enDir)
  return entries.filter((f) => f.startsWith('ai__') && f.endsWith('.md')).sort()
}

async function listAiTouchingElementFiles(): Promise<string[]> {
  // Filter by parsing each en/ file's frontmatter and including those
  // whose `category` array contains any `ai__*` entry. Keeps the
  // selection deterministic and independent of filename conventions.
  const enDir = join(V1_CONTENT, 'elements', 'en')
  const entries = (await readdir(enDir)).filter((f) => f.endsWith('.md')).sort()
  const out: string[] = []
  for (const filename of entries) {
    const raw = await readFile(join(enDir, filename), 'utf8').catch(() => '')
    const fm = parseFrontmatter(raw)
    if (!fm) continue
    const cats = fm.category
    if (!Array.isArray(cats)) continue
    if ((cats as unknown[]).some((c) => typeof c === 'string' && c.startsWith('ai__'))) {
      out.push(filename)
    }
  }
  return out
}

function toYaml(value: unknown): string {
  return yaml.dump(value, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  })
}

async function main(): Promise<void> {
  const warnings: MigrationWarning[] = []

  // Resolve target directory and wipe it for idempotency.
  const versionOutDir = join(OUT_ROOT, VERSION_DIR)
  await rm(versionOutDir, { recursive: true, force: true })
  await mkdir(join(versionOutDir, 'categories'), { recursive: true })
  await mkdir(join(versionOutDir, 'elements'), { recursive: true })
  await mkdir(join(versionOutDir, 'symbols'), { recursive: true })

  // ---- Categories ----
  const categoryFiles = await listAiCategoryFiles()
  const categories = []
  for (const filename of categoryFiles) {
    const bundle = await readLocaleBundle(['categories'], filename)
    const cat = transformCategory(filename, bundle, warnings)
    if (!cat) continue
    categories.push(cat)
    await writeFile(
      join(versionOutDir, 'categories', `${cat.id}.yaml`),
      toYaml(cat),
      'utf8',
    )
  }
  console.log(`Wrote ${categories.length} categories`)

  // ---- Elements ----
  const elementFiles = await listAiTouchingElementFiles()
  let elementCount = 0
  const usedFilenames = new Set<string>()
  const symbolIds = new Set<string>()
  for (const filename of elementFiles) {
    const bundle = await readLocaleBundle(['elements'], filename)
    const el = transformElement(filename, bundle, warnings)
    if (!el) continue
    if (usedFilenames.has(`${el.id}.yaml`)) {
      warnings.push({
        code: 'DUPLICATE_ELEMENT_ID',
        filename,
        message: `Duplicate element id '${el.id}' from file '${filename}'; second file skipped.`,
      })
      continue
    }
    usedFilenames.add(`${el.id}.yaml`)
    symbolIds.add(el.symbol_id)
    await writeFile(join(versionOutDir, 'elements', `${el.id}.yaml`), toYaml(el), 'utf8')
    elementCount++
  }
  console.log(`Wrote ${elementCount} elements (from ${elementFiles.length} AI-touching files)`)

  // ---- Symbol SVGs ----
  // Copy unique `symbol_id`.svg files from the v1 symbol library into
  // the release's `symbols/` directory. Fail the migration if any
  // referenced source file is missing (listing all misses at once).
  const missingSymbols: Array<{ symbolId: string; sourcePath: string }> = []
  const sortedSymbolIds = [...symbolIds].sort()
  for (const symbolId of sortedSymbolIds) {
    const src = join(V1_SYMBOL_SOURCE_DIR, `${symbolId}.svg`)
    try {
      await stat(src)
    } catch {
      missingSymbols.push({ symbolId, sourcePath: src })
      continue
    }
    const dest = join(versionOutDir, 'symbols', `${symbolId}.svg`)
    await copyFile(src, dest)
  }
  if (missingSymbols.length > 0) {
    const lines = missingSymbols
      .map((m) => `  - symbol_id '${m.symbolId}' (expected at ${m.sourcePath})`)
      .join('\n')
    throw new Error(
      `${missingSymbols.length} referenced symbol file(s) missing from ${V1_SYMBOL_SOURCE_DIR}:\n${lines}`,
    )
  }
  console.log(`Copied ${sortedSymbolIds.length} unique symbol SVGs`)

  // ---- Datachain type ----
  // Preserve v1 category order: sort by (order, id) — older v1 order values exist on the per-category YAML.
  const orderedCategoryIds = [...categories]
    .sort((a, b) => (a.order - b.order) || a.id.localeCompare(b.id))
    .map((c) => c.id)
  const dtBundle = await readLocaleBundle(['datachain_types'], 'ai.md')
  const datachainType = transformDatachainType(dtBundle, orderedCategoryIds)
  await writeFile(join(versionOutDir, 'datachain-type.yaml'), toYaml(datachainType), 'utf8')

  // ---- Manifest ----
  const manifest = {
    version: 'ai@2026-04-16-beta',
    status: 'beta',
    created_at: '2026-04-16T00:00:00.000Z',
    notes:
      'Initial port of AI datachain from app/content/dtpr.v1/. See ' +
      'docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md Unit 5.',
    // content_hash is stamped by `schema:build`; use a placeholder in source.
    content_hash: `sha256-${'0'.repeat(64)}`,
    locales: MIGRATION_LOCALES as readonly LocaleCode[],
  }
  await writeFile(join(versionOutDir, 'meta.yaml'), toYaml(manifest), 'utf8')

  // ---- Warnings summary ----
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warnings:`)
    for (const w of warnings) console.log(`  [${w.code}] ${w.filename}: ${w.message}`)
  } else {
    console.log(`\nNo warnings.`)
  }

  // ---- Validate ----
  console.log(`\nValidating ai@2026-04-16-beta...`)
  const result = await validateCmd('ai@2026-04-16-beta', {
    sourceRoot: resolve(OUT_ROOT),
  })
  if (!result.ok) {
    console.error(`Validation failed with ${result.errorCount} errors.`)
    process.exit(1)
  }
  console.log(`Validation passed (${result.warningCount} warnings).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
