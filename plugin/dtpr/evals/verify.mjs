#!/usr/bin/env node
/**
 * Offline conformance check for the DTPR plugin's skills, eval sets, and
 * research corpus.
 *
 * Runs as `node plugin/dtpr/evals/verify.mjs` from the repo root.
 * Intentionally uses only Node builtins so it can run without installing
 * plugin-specific deps (the plugin is not a pnpm workspace package).
 *
 * Checks:
 *   1. Each SKILL.md parses and has required YAML frontmatter
 *      (`name`, `description`) with non-empty values and a non-empty body.
 *   2. Each eval set parses as JSON and has `should_trigger` +
 *      `should_not_trigger` arrays with unique `id` fields and non-empty
 *      `prompt` strings. Each list must have at least one entry.
 *   3. Every MCP tool name that appears in a SKILL.md body still exists
 *      in the live MCP tool registry (read from api/src/mcp/tools.ts and
 *      api/src/mcp/tools/*.ts). Catches drift when tools are renamed or
 *      removed upstream.
 *   4. Research corpus entries match the YYYY-MM-DDThhmm-<slug>.md
 *      naming convention and carry required frontmatter with a closed
 *      `authority_tier` enum, ISO 8601 dates, and a non-empty
 *      `applicability_tags` list.
 *   5. research/INDEX.md has the expected header, every data row
 *      references an existing entry file, and (when git history is
 *      available) the file was modified append-only against the merge
 *      base with origin/main.
 *   6. Every cross-sibling should_not_trigger entry (id prefixed with
 *      `cross-sibling:<sibling-skill>:<positive-id>`) has a matching
 *      `should_trigger` entry on the named sibling skill.
 *
 * Exits 0 on success, 1 on any failure, with a human-readable
 * explanation of what failed and where.
 */

import { execSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const EVALS_DIR = dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = dirname(EVALS_DIR)
const SKILLS_DIR = join(PLUGIN_ROOT, 'skills')
const RESEARCH_DIR = join(PLUGIN_ROOT, 'research')
const INDEX_PATH = join(RESEARCH_DIR, 'INDEX.md')
const REPO_ROOT = dirname(dirname(PLUGIN_ROOT))
const TOOLS_SRC = join(REPO_ROOT, 'api', 'src', 'mcp', 'tools.ts')
const TOOLS_DIR = join(REPO_ROOT, 'api', 'src', 'mcp', 'tools')
const INDEX_RELPATH = 'plugin/dtpr/research/INDEX.md'

const AUTHORITY_TIER_ENUM = [
  'primary-source',
  'peer-reviewed',
  'standards-body',
  'regulatory-text',
  'industry-report',
  'engineering-postmortem',
  'secondary-commentary',
  'speculative',
]
const AUTHORITY_TIER_SET = new Set(AUTHORITY_TIER_ENUM)

const CORPUS_SLUG_RE = /^\d{4}-\d{2}-\d{2}T\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const EXPECTED_INDEX_HEADER =
  '| slug | title | applicability_tags | authority_tier | date_accessed | recheck_after |'

const CORPUS_FRONTMATTER_KNOWN = new Set([
  'source',
  'date_accessed',
  'authority_tier',
  'applicability_tags',
  'recheck_after',
  'supersedes',
  'superseded_by',
  'content_hash',
])
// Substrings that indicate a frontmatter key is a typo of a known field.
const CORPUS_TYPO_HINTS = [
  'authority',
  'applicability',
  'source',
  'date_access',
  'recheck',
  'supersede',
  'content_hash',
]

/** Collect failures instead of exiting early so a single run surfaces everything that's broken. */
const failures = []
const warnings = []
const fail = (msg) => failures.push(msg)
const warn = (msg) => warnings.push(msg)

function parseFrontmatter(markdown, filePath) {
  if (!markdown.startsWith('---\n')) {
    fail(`${filePath}: missing YAML frontmatter (file must start with '---').`)
    return null
  }
  const end = markdown.indexOf('\n---\n', 4)
  if (end === -1) {
    fail(`${filePath}: unterminated YAML frontmatter (missing closing '---').`)
    return null
  }
  const block = markdown.slice(4, end)
  const body = markdown.slice(end + 5)
  const fm = {}
  for (const line of block.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!match) continue
    fm[match[1]] = match[2].trim()
  }
  return { frontmatter: fm, body }
}

/**
 * Parse a bracketed YAML-flow-style array like `[a, b, c]`. Returns an array
 * of trimmed strings, or null if the input does not match that shape.
 */
function parseBracketedArray(raw) {
  if (typeof raw !== 'string') return null
  const m = raw.match(/^\[(.*)\]$/)
  if (!m) return null
  const inner = m[1].trim()
  if (inner === '') return []
  return inner
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

function verifySkill(skillDir) {
  const skillPath = join(skillDir, 'SKILL.md')
  let raw
  try {
    raw = readFileSync(skillPath, 'utf8')
  } catch (e) {
    fail(`${skillPath}: missing or unreadable (${e.message}).`)
    return null
  }

  const parsed = parseFrontmatter(raw, skillPath)
  if (!parsed) return null

  const { frontmatter, body } = parsed
  for (const key of ['name', 'description']) {
    if (!frontmatter[key] || frontmatter[key].length === 0) {
      fail(`${skillPath}: frontmatter is missing non-empty '${key}'.`)
    }
  }
  if (body.trim().length === 0) {
    fail(`${skillPath}: body is empty.`)
  }

  return { path: skillPath, body }
}

function verifyEvalSet(evalFile, skillDirNames) {
  const evalPath = join(EVALS_DIR, evalFile)
  let data
  try {
    data = JSON.parse(readFileSync(evalPath, 'utf8'))
  } catch (e) {
    fail(`${evalPath}: invalid JSON (${e.message}).`)
    return null
  }
  // Orphaned eval set — the skill it's associated with was renamed or deleted.
  if (typeof data.skill === 'string' && !skillDirNames.has(data.skill)) {
    fail(
      `${evalPath}: 'skill' field '${data.skill}' does not match any skill directory in ${SKILLS_DIR}.`,
    )
  }
  for (const key of ['should_trigger', 'should_not_trigger']) {
    const arr = data[key]
    if (!Array.isArray(arr) || arr.length === 0) {
      fail(`${evalPath}: '${key}' must be a non-empty array.`)
      continue
    }
    const ids = new Set()
    for (const entry of arr) {
      if (typeof entry !== 'object' || entry === null) {
        fail(`${evalPath}: '${key}' contains a non-object entry.`)
        continue
      }
      if (!entry.id || ids.has(entry.id)) {
        fail(`${evalPath}: '${key}' entry is missing 'id' or has a duplicate id.`)
      } else {
        ids.add(entry.id)
      }
      if (typeof entry.prompt !== 'string' || entry.prompt.length === 0) {
        fail(`${evalPath}: '${key}' entry '${entry.id ?? '?'}' is missing a non-empty 'prompt'.`)
      }
    }
  }
  return { path: evalPath, file: evalFile, data }
}

function loadMcpToolNames() {
  const names = new Set()
  const sources = [TOOLS_SRC]
  try {
    const entries = readdirSync(TOOLS_DIR, { withFileTypes: true })
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.ts')) sources.push(join(TOOLS_DIR, e.name))
    }
  } catch (e) {
    // TOOLS_DIR missing is fine — only tools.ts registrations matter then.
  }
  for (const src of sources) {
    let content
    try {
      content = readFileSync(src, 'utf8')
    } catch (e) {
      fail(`${src}: cannot read MCP tool source (${e.message}).`)
      continue
    }
    // Match: descriptor: { name: 'foo', ...  }  (single- or double-quoted.)
    const re = /descriptor:\s*\{\s*name:\s*['"]([a-z_][a-z0-9_]*)['"]/g
    for (const m of content.matchAll(re)) names.add(m[1])
  }
  if (names.size === 0) {
    fail(`${TOOLS_SRC}: no MCP tool names extracted (regex drift?).`)
  }
  return names
}

function verifyToolReferences(skills, toolNames) {
  // Skill bodies use markdown code-span backticks for tool names.
  // Accept any token matching MCP tool naming (`[a-z_][a-z0-9_]*`) inside
  // backticks, then filter for tokens that *look like* tool names (snake_case
  // with no dots or slashes). Flag when such a token is not in the registry.
  //
  // Scope: only SKILL.md bodies. research/*.md and references/*.md are free
  // to use snake_case domain terms without tripping drift detection.
  const knownNonTools = new Set([
    'fix_hint',
    'fix_hints',
    'content_hash',
    'category_id',
    'category_ids',
    'element_id',
    'element_ids',
    'is_ai',
    'is_mcp',
    'next_cursor',
    'is_error',
    'ok',
    'datachain_type',
    'datachain_instance',
    'schema_json',
    'on',
    'off',
    'tools_list',
    'r2_bucket',
    'x_robots_tag',
    // Corpus / domain terms that may appear in SKILL.md prose.
    'applicability_tags',
    'authority_tier',
    'recheck_after',
    'date_accessed',
    'superseded_by',
    'rubric_version',
    'template_version',
    'icon_variants',
    // Retired skill id appears in handoff prose during the transition.
    'schema_new',
  ])
  for (const { path, body } of skills) {
    const backtickTokens = [...body.matchAll(/`([a-z_][a-z0-9_]*)`/g)].map((m) => m[1])
    for (const tok of backtickTokens) {
      if (knownNonTools.has(tok)) continue
      if (!tok.includes('_')) continue // single-word tokens (`ok`, `beta`) — likely not tool names
      if (toolNames.has(tok)) continue
      fail(
        `${path}: backticked token \`${tok}\` looks like an MCP tool name but is not registered in ${TOOLS_SRC}.`,
      )
    }
  }
}

function verifyCorpusEntry(entryPath, fileName) {
  if (!CORPUS_SLUG_RE.test(fileName)) {
    fail(
      `${entryPath}: filename does not match YYYY-MM-DDThhmm-<kebab-slug>.md convention.`,
    )
    return
  }
  let raw
  try {
    raw = readFileSync(entryPath, 'utf8')
  } catch (e) {
    fail(`${entryPath}: missing or unreadable (${e.message}).`)
    return
  }
  const parsed = parseFrontmatter(raw, entryPath)
  if (!parsed) return
  const { frontmatter } = parsed

  for (const key of ['source', 'date_accessed', 'authority_tier', 'applicability_tags']) {
    if (!frontmatter[key] || frontmatter[key].length === 0) {
      fail(`${entryPath}: frontmatter is missing non-empty '${key}'.`)
    }
  }
  if (frontmatter.date_accessed && !ISO_DATE_RE.test(frontmatter.date_accessed)) {
    fail(`${entryPath}: 'date_accessed' must be ISO 8601 YYYY-MM-DD (got '${frontmatter.date_accessed}').`)
  }
  if (frontmatter.recheck_after && !ISO_DATE_RE.test(frontmatter.recheck_after)) {
    fail(`${entryPath}: 'recheck_after' must be ISO 8601 YYYY-MM-DD (got '${frontmatter.recheck_after}').`)
  }
  if (frontmatter.authority_tier && !AUTHORITY_TIER_SET.has(frontmatter.authority_tier)) {
    fail(
      `${entryPath}: 'authority_tier' must be one of: ${AUTHORITY_TIER_ENUM.join(', ')} (got '${frontmatter.authority_tier}').`,
    )
  }
  if (frontmatter.applicability_tags) {
    const tags = parseBracketedArray(frontmatter.applicability_tags)
    if (tags === null) {
      fail(
        `${entryPath}: 'applicability_tags' must be a bracketed list like [tag1, tag2].`,
      )
    } else if (tags.length === 0) {
      fail(`${entryPath}: 'applicability_tags' must be non-empty.`)
    }
  }

  // Surface misspellings of known fields; leave unrelated extensions alone.
  for (const key of Object.keys(frontmatter)) {
    if (CORPUS_FRONTMATTER_KNOWN.has(key)) continue
    if (CORPUS_TYPO_HINTS.some((hint) => key.includes(hint))) {
      fail(`${entryPath}: unknown frontmatter key '${key}' — possible typo of a known field.`)
    }
  }
}

function listCorpusEntries() {
  let entries
  try {
    entries = readdirSync(RESEARCH_DIR, { withFileTypes: true })
  } catch (e) {
    return []
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .filter((e) => e.name !== 'README.md' && e.name !== 'INDEX.md')
    .filter((e) => !e.name.startsWith('_')) // privacy-sensitive entries are gitignored
    .map((e) => ({ path: join(RESEARCH_DIR, e.name), name: e.name }))
}

function verifyIndex(indexPath, knownEntryFileNames) {
  let raw
  try {
    raw = readFileSync(indexPath, 'utf8')
  } catch (e) {
    fail(`${indexPath}: missing or unreadable (${e.message}).`)
    return
  }
  const lines = raw.split('\n')
  const headerIdx = lines.findIndex((l) => l.trim() === EXPECTED_INDEX_HEADER)
  if (headerIdx === -1) {
    fail(
      `${indexPath}: missing expected header row '${EXPECTED_INDEX_HEADER}'.`,
    )
    return
  }
  // The separator row immediately follows; body rows start at headerIdx + 2.
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    if (!line.startsWith('|')) continue
    // Strip leading and trailing `|`, then split.
    const cells = line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
    if (cells.length === 0 || !cells[0]) continue
    const slug = cells[0]
    if (!CORPUS_SLUG_RE.test(slug)) {
      fail(`${indexPath}: row references slug '${slug}' that does not match corpus naming convention.`)
      continue
    }
    if (!knownEntryFileNames.has(slug)) {
      fail(`${indexPath}: row references slug '${slug}' but no matching file exists in ${RESEARCH_DIR}.`)
    }
  }
  verifyIndexAppendOnly(indexPath, raw)
}

function verifyIndexAppendOnly(indexPath, current) {
  let base
  try {
    base = execSync('git merge-base origin/main HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    warn(`${indexPath}: git merge-base origin/main unavailable; skipping append-only check.`)
    return
  }
  if (!base) {
    warn(`${indexPath}: empty merge-base; skipping append-only check.`)
    return
  }
  let baseContent
  try {
    baseContent = execSync(`git show ${base}:${INDEX_RELPATH}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString()
  } catch {
    // File did not exist at base — new file, nothing to enforce.
    return
  }
  if (!current.startsWith(baseContent)) {
    fail(
      `${indexPath}: not append-only. Base content at merge-base ${base.slice(0, 7)} is not a byte-prefix of the current file.`,
    )
  }
}

function verifyEvalSymmetry(evalSets, skillDirNames) {
  // Build: skillName → Set of should_trigger ids
  const positives = new Map()
  for (const set of evalSets) {
    const skill = set.data.skill
    if (typeof skill !== 'string') continue
    const ids = new Set((set.data.should_trigger || []).map((e) => e.id).filter(Boolean))
    positives.set(skill, ids)
  }
  for (const set of evalSets) {
    const selfSkill = set.data.skill
    for (const entry of set.data.should_not_trigger || []) {
      if (!entry.id || typeof entry.id !== 'string') continue
      if (!entry.id.startsWith('cross-sibling:')) continue
      const parts = entry.id.split(':')
      if (parts.length < 3) {
        fail(
          `${set.path}: cross-sibling id '${entry.id}' must be of the form 'cross-sibling:<sibling-skill>:<matching-positive-id>'.`,
        )
        continue
      }
      const sibling = parts[1]
      const positiveId = parts.slice(2).join(':')
      if (!sibling) {
        fail(`${set.path}: cross-sibling id '${entry.id}' missing sibling slug.`)
        continue
      }
      if (!positiveId) {
        fail(`${set.path}: cross-sibling id '${entry.id}' missing matching positive id.`)
        continue
      }
      if (sibling === selfSkill) {
        fail(
          `${set.path}: cross-sibling target '${sibling}' is the same skill as this eval file.`,
        )
        continue
      }
      if (!skillDirNames.has(sibling)) {
        fail(
          `${set.path}: cross-sibling target '${sibling}' does not match any skill directory.`,
        )
        continue
      }
      const siblingPositives = positives.get(sibling)
      if (!siblingPositives || siblingPositives.size === 0) {
        fail(
          `${set.path}: cross-sibling target '${sibling}' has no should_trigger entries to match against.`,
        )
        continue
      }
      if (!siblingPositives.has(positiveId)) {
        fail(
          `${set.path}: cross-sibling id '${entry.id}' has no matching should_trigger id '${positiveId}' in ${sibling}'s eval file.`,
        )
      }
    }
  }
}

function main() {
  const skillDirents = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter(
    (d) => d.isDirectory(),
  )
  const skillDirNames = new Set(skillDirents.map((d) => d.name))
  const skillDirs = skillDirents.map((d) => join(SKILLS_DIR, d.name))

  if (skillDirs.length === 0) {
    fail(`${SKILLS_DIR}: no skill directories found.`)
  }

  const skills = skillDirs.map(verifySkill).filter(Boolean)

  const evalFiles = readdirSync(EVALS_DIR).filter((f) => f.endsWith('.evals.json'))
  if (evalFiles.length === 0) {
    fail(`${EVALS_DIR}: no *.evals.json files found.`)
  }
  const evalSets = []
  for (const f of evalFiles) {
    const set = verifyEvalSet(f, skillDirNames)
    if (set) evalSets.push(set)
  }

  const toolNames = loadMcpToolNames()
  verifyToolReferences(skills, toolNames)

  const corpusEntries = listCorpusEntries()
  const corpusFileNames = new Set(corpusEntries.map((e) => e.name))
  for (const entry of corpusEntries) verifyCorpusEntry(entry.path, entry.name)
  verifyIndex(INDEX_PATH, corpusFileNames)

  verifyEvalSymmetry(evalSets, skillDirNames)

  for (const w of warnings) console.warn(`plugin/dtpr conformance warning: ${w}`)

  if (failures.length > 0) {
    console.error('plugin/dtpr conformance check FAILED:')
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }
  console.log(
    `plugin/dtpr conformance check passed: ${skills.length} skills, ${evalFiles.length} eval sets, ${toolNames.size} MCP tools, ${corpusEntries.length} corpus entries.`,
  )
}

main()
