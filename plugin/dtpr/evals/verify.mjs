#!/usr/bin/env node
/**
 * Offline conformance check for the DTPR plugin's skills and eval sets.
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
 *      in the live MCP tool registry (read from api/src/mcp/tools.ts).
 *      Catches drift when tools are renamed or removed upstream.
 *
 * Exits 0 on success, 1 on the first failure, with a human-readable
 * explanation of what failed and where.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const EVALS_DIR = dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = dirname(EVALS_DIR)
const SKILLS_DIR = join(PLUGIN_ROOT, 'skills')
const REPO_ROOT = dirname(dirname(PLUGIN_ROOT))
const TOOLS_SRC = join(REPO_ROOT, 'api', 'src', 'mcp', 'tools.ts')

/** Collect failures instead of exiting early so a single run surfaces everything that's broken. */
const failures = []
const fail = (msg) => failures.push(msg)

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
    // Keep the raw value; multi-line YAML is not expected in skill frontmatter.
    fm[match[1]] = match[2].trim()
  }
  return { frontmatter: fm, body }
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
    return
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
}

function loadMcpToolNames() {
  let src
  try {
    src = readFileSync(TOOLS_SRC, 'utf8')
  } catch (e) {
    fail(`${TOOLS_SRC}: cannot read MCP tool source (${e.message}).`)
    return new Set()
  }
  // Match: descriptor: { name: 'foo', ...  }  (single- or double-quoted.)
  const re = /descriptor:\s*\{\s*name:\s*['"]([a-z_][a-z0-9_]*)['"]/g
  const names = new Set()
  for (const m of src.matchAll(re)) names.add(m[1])
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
    'schema_json',
    'on',
    'off',
    'tools_list',
    'r2_bucket',
    'x_robots_tag',
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
  for (const f of evalFiles) verifyEvalSet(f, skillDirNames)

  const toolNames = loadMcpToolNames()
  verifyToolReferences(skills, toolNames)

  if (failures.length > 0) {
    console.error('plugin/dtpr conformance check FAILED:')
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }
  console.log(
    `plugin/dtpr conformance check passed: ${skills.length} skills, ${evalFiles.length} eval sets, ${toolNames.size} MCP tools.`,
  )
}

main()
