import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'

/**
 * Bundle plugin SKILL.md files (and the shared reference markdown they
 * cite) into a TypeScript module the MCP `prompts/list` and
 * `prompts/get` handlers can serve.
 *
 * Wire path:
 *   plugin/dtpr/skills/<id>/SKILL.md  -> { name: '<id>', body, description }
 *   plugin/dtpr/references/<slug>.md  -> { name: 'dtpr-references-<slug>', body, description }
 *
 * The skill bodies cite `plugin/dtpr/references/<slug>.md` paths that
 * are meaningless outside the plugin checkout. The bundler rewrites
 * those citations to point at the sibling reference prompts so the
 * skill body stays self-coherent when loaded via MCP.
 */

export interface BundledPrompt {
  name: string
  description: string
  body: string
}

interface FrontmatterParsed {
  frontmatter: Record<string, unknown>
  body: string
}

/** Cap on the description shown in `prompts/list` responses. The
 * full SKILL.md description (often 1–2 KB) is preserved verbatim
 * inside the body — this short form just keeps client pickers from
 * drowning in trigger-phrase prose. */
const PROMPTS_LIST_DESCRIPTION_MAX = 240

const REFERENCE_PROMPT_PREFIX = 'dtpr-references-'

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/

function parseFrontmatter(raw: string, filePath: string): FrontmatterParsed {
  const m = FRONTMATTER_RE.exec(raw)
  if (!m) {
    throw new Error(`${filePath}: missing or malformed YAML frontmatter`)
  }
  const fm = yaml.load(m[1]!) as Record<string, unknown> | null
  if (!fm || typeof fm !== 'object') {
    throw new Error(`${filePath}: frontmatter is not a YAML mapping`)
  }
  return { frontmatter: fm, body: m[2] ?? '' }
}

/** Trim a long SKILL.md description to the first sentence (or first
 * `PROMPTS_LIST_DESCRIPTION_MAX` chars on a hard cut). */
function shortDescription(full: string): string {
  const trimmed = full.trim()
  if (trimmed.length <= PROMPTS_LIST_DESCRIPTION_MAX) return trimmed
  // Prefer a sentence boundary inside the cap.
  const slice = trimmed.slice(0, PROMPTS_LIST_DESCRIPTION_MAX)
  const lastPeriod = slice.lastIndexOf('. ')
  if (lastPeriod > 80) {
    return slice.slice(0, lastPeriod + 1)
  }
  return slice.replace(/\s+\S*$/, '') + '…'
}

/** Rewrite plugin-local reference citations to MCP prompt names so
 * the body still reads correctly when loaded outside the plugin
 * checkout. Path-only — does not rewrite verbs or surrounding prose. */
export function rewriteReferenceCitations(body: string): string {
  return body.replace(
    /`plugin\/dtpr\/references\/([a-z0-9-]+)\.md`/g,
    (_match, slug) => `\`${REFERENCE_PROMPT_PREFIX}${slug}\` (load via MCP prompts/get)`,
  )
}

async function readSkillEntry(skillDir: string, dirName: string): Promise<BundledPrompt> {
  const skillPath = join(skillDir, 'SKILL.md')
  const raw = await readFile(skillPath, 'utf8')
  const { frontmatter, body } = parseFrontmatter(raw, skillPath)
  const name = frontmatter['name']
  const description = frontmatter['description']
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`${skillPath}: frontmatter 'name' must be a non-empty string`)
  }
  if (typeof description !== 'string' || description.length === 0) {
    throw new Error(`${skillPath}: frontmatter 'description' must be a non-empty string`)
  }
  if (name !== dirName) {
    throw new Error(
      `${skillPath}: frontmatter name '${name}' does not match directory name '${dirName}'`,
    )
  }
  // Reconstruct the bundled body with the original frontmatter intact
  // (consumers benefit from seeing the dispatch description) plus the
  // reference-rewritten body.
  const rewritten = rewriteReferenceCitations(body)
  const bundled = `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n\n${rewritten.trimStart()}`
  return {
    name,
    description: shortDescription(description),
    body: bundled,
  }
}

async function readReferenceEntry(refPath: string, slug: string): Promise<BundledPrompt> {
  const raw = await readFile(refPath, 'utf8')
  // Reference files have lightweight frontmatter (rubric_version /
  // template_version) — keep the file verbatim.
  const name = `${REFERENCE_PROMPT_PREFIX}${slug}`
  // Pull a description from the first paragraph after the H1.
  const firstParaMatch = /^#\s+[^\n]+\n+([^\n][^\n]*(?:\n[^\n][^\n]*)*)/m.exec(raw)
  const description = firstParaMatch
    ? shortDescription(firstParaMatch[1]!.replace(/\s+/g, ' ').trim())
    : `${slug.replace(/-/g, ' ')} reference document`
  return { name, description, body: raw }
}

export interface BundleSkillsOptions {
  /** Plugin root containing `skills/` and `references/`. Defaults to
   * the repo's `plugin/dtpr/`. */
  pluginRoot: string
  /** Output module path (TS file). The caller is responsible for
   * picking a path under `api/src/`. */
  outputPath: string
}

export interface BundleSkillsResult {
  ok: true
  prompts: BundledPrompt[]
  outputPath: string
  outputBytes: number
}

/** Read all SKILL.md files and reference files, rewrite citations,
 * and emit a TS module exporting `BUNDLED_PROMPTS`. */
export async function bundleSkills(opts: BundleSkillsOptions): Promise<BundleSkillsResult> {
  const skillsRoot = join(opts.pluginRoot, 'skills')
  const referencesRoot = join(opts.pluginRoot, 'references')

  const skillDirents = await readdir(skillsRoot, { withFileTypes: true })
  const skillDirs = skillDirents
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => ({ dir: join(skillsRoot, d.name), name: d.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (skillDirs.length === 0) {
    throw new Error(`${skillsRoot}: no skill directories found`)
  }

  const skillPrompts = await Promise.all(
    skillDirs.map(({ dir, name }) => readSkillEntry(dir, name)),
  )

  let referencePrompts: BundledPrompt[] = []
  try {
    const refDirents = await readdir(referencesRoot, { withFileTypes: true })
    const refFiles = refDirents
      .filter((d) => d.isFile() && d.name.endsWith('.md'))
      .map((d) => ({ path: join(referencesRoot, d.name), slug: d.name.replace(/\.md$/, '') }))
      .sort((a, b) => a.slug.localeCompare(b.slug))
    referencePrompts = await Promise.all(
      refFiles.map(({ path, slug }) => readReferenceEntry(path, slug)),
    )
  } catch (e) {
    // No references dir is fine — skills will still bundle.
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
  }

  const prompts = [...skillPrompts, ...referencePrompts]

  const tsModule = renderTsModule(prompts)
  await writeFile(opts.outputPath, tsModule, 'utf8')
  return { ok: true, prompts, outputPath: opts.outputPath, outputBytes: tsModule.length }
}

function renderTsModule(prompts: BundledPrompt[]): string {
  const header = `/**
 * AUTOGENERATED by \`pnpm --filter ./api bundle:skills\` — do not edit.
 *
 * Bundles \`plugin/dtpr/skills/*\\/SKILL.md\` and
 * \`plugin/dtpr/references/*.md\` so the MCP server can serve them as
 * registered prompts. Drift is caught by the plugin verify step.
 */
`
  const interfaceDecl = `export interface BundledPrompt {
  readonly name: string
  readonly description: string
  readonly body: string
}
`
  const entries = prompts
    .map(
      (p) =>
        `  {\n    name: ${JSON.stringify(p.name)},\n    description: ${JSON.stringify(p.description)},\n    body: ${JSON.stringify(p.body)},\n  },`,
    )
    .join('\n')
  return `${header}\n${interfaceDecl}\nexport const BUNDLED_PROMPTS: ReadonlyArray<BundledPrompt> = [\n${entries}\n]\n`
}
