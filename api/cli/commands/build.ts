import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundleToFiles, buildBundle } from '../lib/json-emitter.ts'
import { readSchemaVersion, YamlReadError } from '../lib/yaml-reader.ts'
import { parseVersion } from '../lib/version-parser.ts'
import { validateVersion } from '../../src/validator/index.ts'
import { checkTranslationStatus } from './translate.ts'

/** `api/` root computed from this module's location so the CLI works
 * regardless of the caller's cwd. */
const API_ROOT = fileURLToPath(new URL('../..', import.meta.url))

/** Emitted beside `manifest.json`; mirrors `translationsKey` in `src/store/keys.ts`. */
export const TRANSLATIONS_FILE = 'translations.json'

export interface BuildOptions {
  /** Schema source tree. Defaults to `<api>/schemas/`. */
  sourceRoot?: string
  /** Emit output directory. Defaults to `<api>/dist/schemas/`. */
  outputRoot?: string
  /** When true, skip writing files — just validate + report. */
  dryRun?: boolean
  /** Sink for human output; defaults to console. */
  log?: (line: string) => void
}

export interface BuildResult {
  ok: boolean
  version: string
  errorCount: number
  warningCount: number
  bundleBytes: number
  outputDir?: string
}

/**
 * Build a single schema version:
 *  1. Parse YAML source into typed schemas.
 *  2. Run semantic validation (never short-circuit).
 *  3. If valid, emit bundle files to <outputRoot>/<version.dir>/, plus
 *     `translations.json` when the version has a `translations.yaml`.
 *
 * Returns a structured result (exit code is up to the bin wrapper).
 */
export async function build(versionArg: string, options: BuildOptions = {}): Promise<BuildResult> {
  const log = options.log ?? ((line: string) => console.log(line))
  const sourceRoot = resolve(options.sourceRoot ?? join(API_ROOT, 'schemas'))
  const outputRoot = resolve(options.outputRoot ?? join(API_ROOT, 'dist', 'schemas'))

  const version = parseVersion(versionArg)
  log(`Building ${version.canonical} from ${sourceRoot}/${version.dir}`)

  const source = await readSchemaVersion(sourceRoot, version)
  const result = validateVersion(source)

  for (const e of result.errors) {
    log(`  error [${e.code}] ${e.path ?? ''}: ${e.message}`)
    if (e.fix_hint) log(`    fix: ${e.fix_hint}`)
  }
  for (const w of result.warnings) {
    log(`  warning [${w.code}] ${w.path ?? ''}: ${w.message}`)
  }

  if (!result.ok) {
    return {
      ok: false,
      version: version.canonical,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      bundleBytes: 0,
    }
  }

  // Review metadata rides along with the bundle but stays out of
  // `content_hash`: resolving a flag is not a taxonomy change.
  const translations = await checkTranslationStatus(join(sourceRoot, version.dir))
  if (translations.kind === 'invalid') {
    for (const p of translations.problems) log(`  error [TRANSLATION_STATUS] translations.yaml: ${p}`)
    return {
      ok: false,
      version: version.canonical,
      errorCount: translations.problems.length,
      warningCount: result.warnings.length,
      bundleBytes: 0,
    }
  }

  const bundle = buildBundle(source)
  const files = bundleToFiles(bundle)
  if (translations.kind === 'ok') {
    files[TRANSLATIONS_FILE] = JSON.stringify(translations.emitted, null, 2)
  }

  if (!options.dryRun) {
    const outDir = join(outputRoot, version.dir)
    await rm(outDir, { recursive: true, force: true })
    await mkdir(outDir, { recursive: true })
    for (const [relPath, content] of Object.entries(files)) {
      const target = join(outDir, relPath)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, content, 'utf8')
    }
    log(`Wrote ${Object.keys(files).length} files to ${outDir}`)
  }

  log(
    `Built ${version.canonical}: ${source.categories.length} categories, ${source.elements.length} elements, ~${bundle.approximateBundleBytes} bytes`,
  )
  return {
    ok: true,
    version: version.canonical,
    errorCount: 0,
    warningCount: result.warnings.length,
    bundleBytes: bundle.approximateBundleBytes,
    outputDir: options.dryRun ? undefined : join(outputRoot, version.dir),
  }
}

/**
 * `schema:validate` is `schema:build` with `dryRun: true` — same read
 * + validate path, no file writes.
 */
export async function validateCmd(
  versionArg: string,
  options: Omit<BuildOptions, 'dryRun'> = {},
): Promise<BuildResult> {
  try {
    return await build(versionArg, { ...options, dryRun: true })
  } catch (e) {
    const log = options.log ?? ((line: string) => console.log(line))
    if (e instanceof YamlReadError) {
      log(`error: ${e.message}`)
      return {
        ok: false,
        version: versionArg,
        errorCount: 1,
        warningCount: 0,
        bundleBytes: 0,
      }
    }
    throw e
  }
}
