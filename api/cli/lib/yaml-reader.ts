import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { CategorySchema } from '../../src/schema/category.ts'
import { DatachainTypeSchema } from '../../src/schema/datachain-type.ts'
import { ElementSchema } from '../../src/schema/element.ts'
import { SchemaManifestSchema } from '../../src/schema/manifest.ts'
import type { SchemaVersionSource } from '../../src/validator/types.ts'
import type { ParsedVersion } from './version-parser.ts'

/**
 * Thrown when YAML parsing or Zod validation fails during CLI reads.
 * Carries the file path so users can pinpoint the offending file.
 */
export class YamlReadError extends Error {
  constructor(message: string, public readonly file?: string) {
    super(message)
    this.name = 'YamlReadError'
  }
}

async function parseYamlFile<T>(path: string, schema: { parse: (v: unknown) => T }): Promise<T> {
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (e) {
    throw new YamlReadError(`Failed to read ${path}: ${(e as Error).message}`, path)
  }
  let parsed: unknown
  try {
    // Use JSON_SCHEMA so ISO timestamps stay as strings (default would
    // return Date objects, which Zod's `datetime()` would reject).
    parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA })
  } catch (e) {
    throw new YamlReadError(`YAML syntax error in ${path}: ${(e as Error).message}`, path)
  }
  try {
    return schema.parse(parsed)
  } catch (e) {
    throw new YamlReadError(`Schema validation failed for ${path}: ${(e as Error).message}`, path)
  }
}

/**
 * Read a schema version directory from disk. Layout:
 *   <rootDir>/<version.dir>/meta.yaml
 *   <rootDir>/<version.dir>/datachain-type.yaml
 *   <rootDir>/<version.dir>/categories/*.yaml
 *   <rootDir>/<version.dir>/elements/*.yaml
 *   <rootDir>/<version.dir>/symbols/*.svg
 */
export async function readSchemaVersion(
  rootDir: string,
  version: ParsedVersion,
): Promise<SchemaVersionSource> {
  const versionDir = join(rootDir, version.dir)

  const manifest = await parseYamlFile(join(versionDir, 'meta.yaml'), SchemaManifestSchema)
  const datachainType = await parseYamlFile(
    join(versionDir, 'datachain-type.yaml'),
    DatachainTypeSchema,
  )

  const categoriesDir = join(versionDir, 'categories')
  const categories = await readAllInDir(categoriesDir, CategorySchema)

  const elementsDir = join(versionDir, 'elements')
  const elements = await readAllInDir(elementsDir, ElementSchema)

  const symbolsDir = join(versionDir, 'symbols')
  const symbols = await readSymbolsDir(symbolsDir)

  return { manifest, datachainType, categories, elements, symbols }
}

/**
 * Load every `*.svg` under `<version.dir>/symbols/` as UTF-8 text,
 * keyed by filename stem (`symbol_id`). Returns an empty map if the
 * directory is missing — the `symbol-refs` rule will then surface a
 * `SYMBOL_NOT_FOUND` per element that references a symbol, which is
 * better feedback than a generic "missing directory" error.
 */
async function readSymbolsDir(dir: string): Promise<Record<string, string>> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return {}
  }
  const svgFiles = entries.filter((f) => f.endsWith('.svg')).sort()
  const symbols: Record<string, string> = {}
  for (const file of svgFiles) {
    const id = file.slice(0, -'.svg'.length)
    try {
      symbols[id] = await readFile(join(dir, file), 'utf8')
    } catch (e) {
      throw new YamlReadError(
        `Failed to read ${join(dir, file)}: ${(e as Error).message}`,
        join(dir, file),
      )
    }
  }
  return symbols
}

async function readAllInDir<T>(
  dir: string,
  schema: { parse: (v: unknown) => T },
): Promise<T[]> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch (e) {
    throw new YamlReadError(`Failed to list ${dir}: ${(e as Error).message}`, dir)
  }
  const yamlFiles = entries.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml')).sort()
  const results: T[] = []
  for (const file of yamlFiles) {
    results.push(await parseYamlFile(join(dir, file), schema))
  }
  return results
}
