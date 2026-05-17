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
 * Uses the pure-Node `archiver` library rather than spawning the
 * system `zip` binary — Cloudflare Workers Builds and other minimal
 * CI containers don't always ship `zip`, and an environment-dependent
 * build is worse than a small dev-dependency.
 */
import { createHash } from 'node:crypto'
import { createWriteStream, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import archiver from 'archiver'

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

async function zipSkillDirectory(skillName: string, outPath: string): Promise<void> {
  // The skill folder must sit at the top of the zip (e.g.
  // `dtpr-translate/SKILL.md`) — that's the layout Claude Desktop
  // expects on upload. `archive.directory(src, name)` writes `src`'s
  // contents under `name` in the archive.
  rmSync(outPath, { force: true })
  await new Promise<void>((resolveZip, rejectZip) => {
    const output = createWriteStream(outPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', () => resolveZip())
    output.on('error', rejectZip)
    archive.on('error', rejectZip)
    archive.pipe(output)
    archive.directory(resolve(skillsRoot, skillName), skillName)
    archive.finalize()
  })
}

async function zipBundle(versionDir: string, outPath: string, fileNames: string[]): Promise<void> {
  rmSync(outPath, { force: true })
  await new Promise<void>((resolveZip, rejectZip) => {
    const output = createWriteStream(outPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', () => resolveZip())
    output.on('error', rejectZip)
    archive.on('error', rejectZip)
    archive.pipe(output)
    for (const name of fileNames) {
      archive.file(resolve(versionDir, name), { name })
    }
    archive.finalize()
  })
}

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

async function main() {
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
    await zipSkillDirectory(v.name, outPath)
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
  await zipBundle(versionDir, bundlePath, ['INSTALL.txt', ...validated.map((v) => `${v.name}.skill`)])
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

main().catch((err) => {
  console.error('[build-skills] FAILED')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
