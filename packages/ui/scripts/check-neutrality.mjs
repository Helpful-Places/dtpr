#!/usr/bin/env node
/**
 * R2 neutrality check: the @dtpr/ui public surface must not reference
 * Clarable-specific naming, Pinia, or admin-* patterns. This runs a
 * simple grep over src/** and fails with a non-zero exit code on match.
 *
 * Usage: node scripts/check-neutrality.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../src', import.meta.url))
const FORBIDDEN = /\b(clarable|pinia|admin-[a-z])/i

function walk(dir) {
  const entries = readdirSync(dir)
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) {
      files.push(...walk(full))
    } else if (/\.(ts|vue|css)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

const violations = []
for (const file of walk(ROOT)) {
  const content = readFileSync(file, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line, idx) => {
    const match = line.match(FORBIDDEN)
    if (match) {
      violations.push({ file: relative(ROOT, file), line: idx + 1, match: match[0] })
    }
  })
}

if (violations.length > 0) {
  console.error('R2 neutrality check failed:')
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  matches "${v.match}"`)
  }
  console.error('\nSee packages/ui/README.md for the neutrality governance rule.')
  process.exit(1)
}

console.log('R2 neutrality check: OK')
