#!/usr/bin/env -S tsx
/**
 * Build-time packager for the DTPR Figma plugin.
 *
 * Why this exists: the plugin is not published to the Figma Community,
 * so the only install path is "import a manifest from disk". That
 * needs a downloadable archive, and this produces one alongside the
 * docs that describe it.
 *
 * Expects `figma-plugin/dist/` to already exist — `dtpr-ai`'s `build`
 * script chains `pnpm --filter @dtpr/figma-plugin build` ahead of this,
 * the same way it chains the API schema and `@dtpr/ui` builds. Missing
 * output is a hard failure rather than a skip, because a silently
 * absent zip would publish docs whose download link 404s.
 *
 * Outputs land under `dtpr-ai/public/figma-plugin/<version>/` and are
 * served from `dtpr.ai/figma-plugin/<version>/...` once the site
 * deploys.
 *
 * Zips are written by the dependency-free ZIP writer in `lib/zip.ts`,
 * shared with the Claude skill packager.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildZip, type ZipEntry } from './lib/zip.ts'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')
const pluginRoot = resolve(repoRoot, 'figma-plugin')
const outRoot = resolve(here, '../public/figma-plugin')

/** Folder name inside the archive, so unzipping yields one tidy directory. */
const ARCHIVE_ROOT = 'dtpr-figma-plugin'
const ZIP_NAME = 'dtpr-figma-plugin.zip'

/**
 * Files the archive ships, as `source path` → `path inside the zip`.
 * The `dist/` layout is preserved because `manifest.json` points at
 * `dist/code.js` and `dist/ui.html`; flattening it would break the
 * import.
 */
const PAYLOAD: Array<{ from: string; to: string }> = [
  { from: 'manifest.json', to: 'manifest.json' },
  { from: 'dist/code.js', to: 'dist/code.js' },
  { from: 'dist/ui.html', to: 'dist/ui.html' },
]

interface FileEntry {
  path: string
  size: number
  sha256: string
}

interface OutputManifest {
  plugin: string
  version: string
  generated_at: string
  archive: FileEntry
  contents: Array<{ name: string; size: number }>
}

function readVersion(): string {
  const raw = readFileSync(resolve(pluginRoot, 'package.json'), 'utf8')
  const parsed = JSON.parse(raw) as { name?: string; version?: string }
  if (!parsed.version) throw new Error('figma-plugin/package.json is missing a version')
  return parsed.version
}

function readPayload(): ZipEntry[] {
  const entries: ZipEntry[] = [{ name: `${ARCHIVE_ROOT}/`, data: Buffer.alloc(0) }]
  const seenDirs = new Set<string>()

  for (const file of PAYLOAD) {
    const full = resolve(pluginRoot, file.from)
    let data: Buffer
    try {
      data = readFileSync(full)
    } catch {
      throw new Error(
        `${relative(repoRoot, full)} is missing. Run \`pnpm --filter @dtpr/figma-plugin build\` first.`
      )
    }
    const dir = dirname(file.to)
    if (dir !== '.' && !seenDirs.has(dir)) {
      seenDirs.add(dir)
      entries.push({ name: `${ARCHIVE_ROOT}/${dir}/`, data: Buffer.alloc(0) })
    }
    entries.push({ name: `${ARCHIVE_ROOT}/${file.to}`, data })
  }

  return entries
}

function installReadme(version: string): string {
  return [
    `DTPR Icon Library — Figma plugin v${version}`,
    '',
    'Generates a DTPR icon component library from the public API at',
    'https://api.dtpr.io. Run it once in an empty Figma file, then publish',
    'the result as a Team Library so designers get the icons in their',
    'Assets panel without installing anything themselves.',
    '',
    'Install:',
    '',
    '  1. Unzip this archive somewhere permanent — Figma reads the plugin',
    '     from disk every time it runs, so a Downloads folder you empty',
    '     will break it.',
    '  2. Open the Figma DESKTOP app (browser Figma cannot load local',
    '     plugins).',
    '  3. Menu -> Plugins -> Development -> Import plugin from manifest...',
    '  4. Select the manifest.json in this folder.',
    '',
    'Run it from Plugins -> Development -> DTPR Icon Library.',
    '',
    'A full build fetches ~470 icons. The API gives icon requests their',
    'own generous rate limit, so the whole set downloads in one pass and',
    'the remaining time is Figma building the components. The "Default',
    'context only" and "Light theme only" options cut the set down when',
    'you only need a quick refresh.',
    '',
    'Source: https://github.com/Helpful-Places/dtpr/tree/main/figma-plugin',
    'Docs:   https://dtpr.ai/en/icons/figma-plugin',
    '',
  ].join('\n')
}

function sha256(filepath: string): string {
  return createHash('sha256').update(readFileSync(filepath)).digest('hex')
}

function main() {
  const version = readVersion()
  console.log(`[build-figma-plugin] packaging v${version}`)

  const entries = readPayload()
  entries.push({
    name: `${ARCHIVE_ROOT}/README.txt`,
    data: Buffer.from(installReadme(version), 'utf8'),
  })

  const versionDir = resolve(outRoot, version)
  rmSync(versionDir, { recursive: true, force: true })
  mkdirSync(versionDir, { recursive: true })

  const zipPath = resolve(versionDir, ZIP_NAME)
  writeFileSync(zipPath, buildZip(entries))
  const size = statSync(zipPath).size
  console.log(`  → ${relative(outRoot, zipPath)} (${size} bytes)`)

  const manifest: OutputManifest = {
    plugin: 'dtpr-figma-plugin',
    version,
    generated_at: new Date().toISOString(),
    archive: { path: `${version}/${ZIP_NAME}`, size, sha256: sha256(zipPath) },
    contents: entries
      .filter((e) => !e.name.endsWith('/'))
      .map((e) => ({ name: e.name.slice(ARCHIVE_ROOT.length + 1), size: e.data.length })),
  }
  const manifestPath = resolve(outRoot, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`  → ${relative(outRoot, manifestPath)}`)

  // Sanity check: the doc should reference the current version so the
  // download link doesn't 404 after a bump. Warn-only, so a CI build
  // that hasn't synced the doc yet doesn't block.
  const doc = resolve(repoRoot, 'dtpr-ai/content/en/4.icons/5.figma-plugin.md')
  try {
    if (!readFileSync(doc, 'utf8').includes(`/figma-plugin/${version}/`)) {
      console.warn(
        `[build-figma-plugin] WARNING: ${relative(repoRoot, doc)} does not reference ` +
          `/figma-plugin/${version}/. Update the download link to point at the new version.`
      )
    }
  } catch {
    // Doc not present in this checkout — skip silently.
  }

  console.log('[build-figma-plugin] done')
}

try {
  main()
} catch (err) {
  console.error('[build-figma-plugin] FAILED')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
