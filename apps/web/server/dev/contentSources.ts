import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Development only (registered under $development in nuxt.config): maps each
// piece of copy in content/ to the file and line it comes from, so Impeccable's
// live editor can find where an edited string lives. See
// app/plugins/impeccable-dev.client.ts.

type SourceLine = { file: string, line: number }
type Index = Record<string, SourceLine[]>

// Copy as it reads on the page: no markdown markers, whitespace collapsed.
function normalize(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*|__|\*|`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function unquote(value: string): string {
  if (value.startsWith('\'') && value.endsWith('\'')) return value.slice(1, -1).replace(/''/g, '\'')
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1).replace(/\\"/g, '"')
  return value
}

function add(index: Index, raw: string, source: SourceLine) {
  const text = normalize(raw)
  if (text.length < 2) return
  ;(index[text] ??= []).push(source)
}

// Each paragraph of a block, keyed to the line it starts on. `first` is the
// file line of lines[0].
function addParagraphs(index: Index, file: string, lines: string[], first: number) {
  let para: string[] = []
  let start = first
  const flush = () => {
    if (para.length) add(index, para.join(' '), { file, line: start })
    para = []
  }
  lines.forEach((line, i) => {
    if (!line.trim()) return flush()
    if (!para.length) start = first + i
    para.push(line)
  })
  flush()
}

// Scalars (`key: value`, `- value`) and block scalars (`key: |`). `first` is
// the file line of lines[0].
function indexYaml(index: Index, file: string, lines: string[], first = 1) {
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(/^(\s*)(?:-\s+)?(?:[\w-]+:\s*)?(.*)$/)
    if (!match) continue
    const indent = match[1]!.length
    const value = match[2]!.trim()
    if (/^[|>][-+]?$/.test(value)) {
      let j = i + 1
      while (j < lines.length && (!lines[j]!.trim() || lines[j]!.search(/\S/) > indent)) j++
      addParagraphs(index, file, lines.slice(i + 1, j).map(line => line.trim()), first + i + 1)
      i = j - 1
    }
    else if (value && !value.endsWith(':')) {
      add(index, unquote(value), { file, line: first + i })
    }
  }
}

// Frontmatter as YAML, then the body: every line on its own (headings, list
// items) and every paragraph, without list, heading or quote markers.
function indexMarkdown(index: Index, file: string, lines: string[]) {
  let start = 0
  if (lines[0]?.trim() === '---') {
    const end = lines.indexOf('---', 1)
    indexYaml(index, file, lines.slice(1, end), 2)
    start = end + 1
  }
  const body = lines.slice(start).map(line => line.replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s?)/, ''))
  body.forEach((line, i) => add(index, line, { file, line: start + i + 1 }))
  addParagraphs(index, file, body, start + 1)
}

export default defineEventHandler(async () => {
  const root = process.cwd()
  const files = (await readdir(join(root, 'content'), { recursive: true }))
    .filter(file => /\.(?:ya?ml|md)$/.test(file))
  const index: Index = {}
  for (const file of files) {
    const path = `content/${file}`
    const lines = (await readFile(join(root, path), 'utf8')).split('\n')
    if (path.endsWith('.md')) indexMarkdown(index, path, lines)
    else indexYaml(index, path, lines)
  }
  return index
})
