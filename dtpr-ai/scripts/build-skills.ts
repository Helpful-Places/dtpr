#!/usr/bin/env -S tsx
/**
 * Build-time packager for the DTPR Claude plugin's skills.
 *
 * Why this exists: Claude Code installs the whole plugin from the
 * marketplace in one click, but Claude Desktop and Claude.ai accept
 * skills one zip at a time through their upload UI. This script
 * produces per-skill `.skill` zips and a combined bundle so those
 * hosts get a friendly download path that matches the plugin source.
 *
 * Validates each SKILL.md's frontmatter against Claude Desktop's
 * 1024-character description cap — a hard failure here is preferable
 * to shipping a bundle that bounces at upload time.
 *
 * Outputs land under `dtpr-ai/public/skills/<version>/` and are
 * served from `dtpr.ai/skills/<version>/...` once the site deploys.
 *
 * Implements its own minimal ZIP writer in pure Node so the build has
 * no external deps: an `archiver` dependency triggers `pnpm install`
 * lockfile churn that upgrades unrelated transitive packages, and a
 * `zip` shell-out fails on minimal CI containers (Cloudflare Workers
 * Builds) that don't ship Info-ZIP. Node 22's `zlib.crc32` makes the
 * in-house path small and reliable.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateRawSync } from 'node:zlib'

const DESCRIPTION_LIMIT = 1024

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')
const pluginRoot = resolve(repoRoot, 'plugin/dtpr')
const skillsRoot = resolve(pluginRoot, 'skills')
const outRoot = resolve(here, '../public/skills')

interface PluginManifest {
  name: string
  version: string
}

interface SkillEntry {
  name: string
  path: string
  size: number
  sha256: string
}

interface BundleEntry {
  path: string
  size: number
  sha256: string
}

interface OutputManifest {
  plugin: string
  version: string
  generated_at: string
  bundle: BundleEntry
  skills: SkillEntry[]
}

function readPluginManifest(): PluginManifest {
  const raw = readFileSync(resolve(pluginRoot, '.claude-plugin/plugin.json'), 'utf8')
  const parsed = JSON.parse(raw) as PluginManifest
  if (!parsed.name || !parsed.version) {
    throw new Error('plugin.json is missing name or version')
  }
  return parsed
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---/.exec(content)
  if (!match) {
    throw new Error('missing YAML frontmatter')
  }
  const fields: Record<string, string> = {}
  const lines = match[1].split('\n')
  let currentKey: string | null = null
  let buf: string[] = []
  const flush = () => {
    if (currentKey) {
      fields[currentKey] = buf.join(' ').replace(/\s+/g, ' ').trim()
    }
  }
  for (const line of lines) {
    const m = /^([a-z_][a-z0-9_]*):\s*(.*)$/.exec(line)
    if (m) {
      flush()
      currentKey = m[1]
      buf = [m[2]]
    } else if (currentKey) {
      buf.push(line.trim())
    }
  }
  flush()
  return fields
}

function validateSkill(dir: string): { name: string; descriptionLength: number } {
  const skillMdPath = resolve(skillsRoot, dir, 'SKILL.md')
  const content = readFileSync(skillMdPath, 'utf8')
  const fm = parseFrontmatter(content)
  if (!fm.name) throw new Error(`${dir}/SKILL.md: missing 'name' in frontmatter`)
  if (!fm.description) throw new Error(`${dir}/SKILL.md: missing 'description' in frontmatter`)
  if (fm.name !== dir) {
    throw new Error(`${dir}/SKILL.md: 'name' (${fm.name}) does not match directory name (${dir})`)
  }
  if (fm.description.length > DESCRIPTION_LIMIT) {
    throw new Error(
      `${dir}/SKILL.md: description is ${fm.description.length} chars, exceeds Claude Desktop's ${DESCRIPTION_LIMIT}-char cap. Trim the description before shipping — the routing-to-siblings block is the usual fat.`
    )
  }
  return { name: fm.name, descriptionLength: fm.description.length }
}

function listSkills(): string[] {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

function sha256(filepath: string): string {
  const hash = createHash('sha256')
  hash.update(readFileSync(filepath))
  return hash.digest('hex')
}

// ---------------------------------------------------------------------------
// Minimal in-process ZIP writer.
//
// Implements ZIP file format spec (APPNOTE.TXT) — local file headers,
// central directory, end-of-central-directory record — with deflate
// compression (method=8). No ZIP64 (file sizes here are tiny). No
// extra fields, no comments, no encryption. CRC32 comes from Node's
// built-in zlib.crc32 (Node 22+).
//
// Each entry is `{ name, data }`. `name` uses forward slashes; trailing
// `/` denotes a directory entry (zero-length data). Returns a Buffer
// suitable for writing to disk with the `.zip` / `.skill` extension.
// ---------------------------------------------------------------------------

interface ZipEntry {
  name: string
  data: Buffer
}

function dosTime(date: Date): { time: number; date: number } {
  // DOS time: bits 0-4 = seconds/2, 5-10 = minute, 11-15 = hour
  // DOS date: bits 0-4 = day, 5-8 = month, 9-15 = year - 1980
  const time =
    (Math.floor(date.getSeconds() / 2) & 0x1f) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getHours() & 0x1f) << 11)
  const dateField =
    (date.getDate() & 0x1f) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (((date.getFullYear() - 1980) & 0x7f) << 9)
  return { time, date: dateField }
}

function buildZip(entries: ZipEntry[]): Buffer {
  const now = new Date()
  const { time: dosT, date: dosD } = dosTime(now)
  const chunks: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, 'utf8')
    const isDir = entry.name.endsWith('/')
    const uncompressed = entry.data
    const uncompSize = uncompressed.length
    const crc = uncompSize === 0 ? 0 : crc32(uncompressed)
    // Directory entries: store empty. File entries: deflate.
    const compressed = isDir || uncompSize === 0 ? Buffer.alloc(0) : deflateRawSync(uncompressed, { level: 9 })
    const compSize = compressed.length
    const method = isDir || uncompSize === 0 ? 0 : 8

    // Local file header (30 bytes + name).
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0) // signature
    localHeader.writeUInt16LE(20, 4)          // version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6)      // general purpose: UTF-8 filename
    localHeader.writeUInt16LE(method, 8)      // compression method
    localHeader.writeUInt16LE(dosT, 10)
    localHeader.writeUInt16LE(dosD, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(compSize, 18)
    localHeader.writeUInt32LE(uncompSize, 22)
    localHeader.writeUInt16LE(nameBytes.length, 26)
    localHeader.writeUInt16LE(0, 28)          // extra field length
    chunks.push(localHeader, nameBytes, compressed)

    // Central directory entry (46 bytes + name).
    const centralEntry = Buffer.alloc(46)
    centralEntry.writeUInt32LE(0x02014b50, 0) // signature
    centralEntry.writeUInt16LE(20, 4)          // version made by (2.0, Unix)
    centralEntry.writeUInt16LE(20, 6)          // version needed
    centralEntry.writeUInt16LE(0x0800, 8)      // general purpose: UTF-8 filename
    centralEntry.writeUInt16LE(method, 10)
    centralEntry.writeUInt16LE(dosT, 12)
    centralEntry.writeUInt16LE(dosD, 14)
    centralEntry.writeUInt32LE(crc, 16)
    centralEntry.writeUInt32LE(compSize, 20)
    centralEntry.writeUInt32LE(uncompSize, 24)
    centralEntry.writeUInt16LE(nameBytes.length, 28)
    centralEntry.writeUInt16LE(0, 30)          // extra field
    centralEntry.writeUInt16LE(0, 32)          // comment
    centralEntry.writeUInt16LE(0, 34)          // disk number start
    centralEntry.writeUInt16LE(0, 36)          // internal attrs
    centralEntry.writeUInt32LE(isDir ? 0x10 : 0, 38) // external attrs (dir flag)
    centralEntry.writeUInt32LE(offset, 42)     // relative offset of local header
    central.push(centralEntry, nameBytes)

    offset += localHeader.length + nameBytes.length + compressed.length
  }

  const centralBuf = Buffer.concat(central)
  const centralOffset = offset
  const centralSize = centralBuf.length

  // End of central directory record (22 bytes).
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)     // signature
  eocd.writeUInt16LE(0, 4)               // disk number
  eocd.writeUInt16LE(0, 6)               // disk where central starts
  eocd.writeUInt16LE(entries.length, 8)  // records on this disk
  eocd.writeUInt16LE(entries.length, 10) // total records
  eocd.writeUInt32LE(centralSize, 12)
  eocd.writeUInt32LE(centralOffset, 16)
  eocd.writeUInt16LE(0, 20)              // comment length

  return Buffer.concat([...chunks, centralBuf, eocd])
}

function readDirRecursive(root: string, base = ''): ZipEntry[] {
  const entries: ZipEntry[] = []
  for (const d of readdirSync(resolve(skillsRoot, root, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${d.name}` : d.name
    if (d.isDirectory()) {
      entries.push({ name: `${root}/${rel}/`, data: Buffer.alloc(0) })
      entries.push(...readDirRecursive(root, rel))
    } else if (d.isFile()) {
      const full = resolve(skillsRoot, root, rel)
      entries.push({ name: `${root}/${rel}`, data: readFileSync(full) })
    }
  }
  return entries
}

function writeSkillZip(skillName: string, outPath: string): void {
  // Top-level dir entry, then everything inside the skill folder. The
  // dir entry isn't strictly required, but Claude Desktop's upload UI
  // and most unzip tools render the archive more cleanly with it.
  const entries: ZipEntry[] = [
    { name: `${skillName}/`, data: Buffer.alloc(0) },
    ...readDirRecursive(skillName),
  ]
  writeFileSync(outPath, buildZip(entries))
}

function writeBundleZip(versionDir: string, outPath: string, fileNames: string[]): void {
  const entries: ZipEntry[] = fileNames.map((name) => ({
    name,
    data: readFileSync(resolve(versionDir, name)),
  }))
  writeFileSync(outPath, buildZip(entries))
}

// ---------------------------------------------------------------------------

function bundleReadme(plugin: PluginManifest, skills: string[]): string {
  const lines = [
    `DTPR Claude plugin — skill bundle v${plugin.version}`,
    '',
    `This zip contains ${skills.length} Agent Skills, each pre-packaged as a \`.skill\``,
    'file (a renamed zip). To install on Claude Desktop or Claude.ai:',
    '',
    '  1. Unzip this archive.',
    "  2. In your host's skill-upload UI, add each `.skill` file one at a time.",
    '  3. Register the DTPR MCP server separately at https://api.dtpr.io/mcp.',
    '',
    'Claude Code users should install via the marketplace instead:',
    '',
    '  /plugin marketplace add Helpful-Places/dtpr',
    '  /plugin install dtpr',
    '',
    'That path bundles the MCP registration and avoids per-skill uploads.',
    '',
    'Skills in this bundle:',
    ...skills.map((s) => `  - ${s}.skill`),
    '',
    'Source: https://github.com/Helpful-Places/dtpr/tree/main/plugin/dtpr',
    'Docs:   https://dtpr.io/plugin/install',
    '',
  ]
  return lines.join('\n')
}

function main() {
  const plugin = readPluginManifest()
  const skills = listSkills()
  console.log(`[build-skills] plugin ${plugin.name} v${plugin.version}, ${skills.length} skills`)

  // Validate everything before writing anything — fail fast.
  const validated = skills.map((dir) => ({ dir, ...validateSkill(dir) }))
  for (const v of validated) {
    console.log(`  ✓ ${v.name} (description: ${v.descriptionLength}/${DESCRIPTION_LIMIT} chars)`)
  }

  const versionDir = resolve(outRoot, plugin.version)
  rmSync(versionDir, { recursive: true, force: true })
  mkdirSync(versionDir, { recursive: true })

  // Per-skill .skill zips.
  const skillEntries: SkillEntry[] = []
  for (const v of validated) {
    const outPath = resolve(versionDir, `${v.name}.skill`)
    writeSkillZip(v.name, outPath)
    const size = statSync(outPath).size
    skillEntries.push({
      name: v.name,
      path: `${plugin.version}/${v.name}.skill`,
      size,
      sha256: sha256(outPath),
    })
    console.log(`  → ${relative(outRoot, outPath)} (${size} bytes)`)
  }

  // Combined bundle: INSTALL.txt + the per-skill .skill files.
  writeFileSync(resolve(versionDir, 'INSTALL.txt'), bundleReadme(plugin, validated.map((v) => v.name)))
  const bundlePath = resolve(versionDir, 'dtpr-skills.zip')
  writeBundleZip(versionDir, bundlePath, ['INSTALL.txt', ...validated.map((v) => `${v.name}.skill`)])
  const bundleSize = statSync(bundlePath).size
  const bundle: BundleEntry = {
    path: `${plugin.version}/dtpr-skills.zip`,
    size: bundleSize,
    sha256: sha256(bundlePath),
  }
  console.log(`  → ${relative(outRoot, bundlePath)} (${bundleSize} bytes)`)

  // Top-level manifest the install page (and any verifier) consumes.
  const manifest: OutputManifest = {
    plugin: plugin.name,
    version: plugin.version,
    generated_at: new Date().toISOString(),
    bundle,
    skills: skillEntries,
  }
  const manifestPath = resolve(outRoot, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`  → ${relative(outRoot, manifestPath)}`)

  // Sanity check: install doc should reference the current version so
  // the download links don't 404 after a bump. Warn-only so a CI
  // build that hasn't synced the doc yet doesn't block.
  const installDoc = resolve(repoRoot, 'dtpr-ai/content/en/7.plugin/1.install.md')
  try {
    const docContent = readFileSync(installDoc, 'utf8')
    if (!docContent.includes(`/skills/${plugin.version}/`)) {
      console.warn(
        `[build-skills] WARNING: ${relative(repoRoot, installDoc)} does not reference /skills/${plugin.version}/. ` +
          `Update the bundled-zip section to point at the new version.`
      )
    }
  } catch {
    // Doc not present in this checkout — skip silently.
  }

  console.log('[build-skills] done')
}

try {
  main()
} catch (err) {
  console.error('[build-skills] FAILED')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
