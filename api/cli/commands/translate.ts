import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { InvalidVersionError, parseVersion } from '../lib/version-parser.ts'
import { LocaleCodeSchema } from '../../src/schema/locale.ts'
import {
  TranslationStatusSchema,
  type EmittedTranslationStatus,
  type TranslationFlagTarget,
  type TranslationStatus,
} from '../../src/schema/translation-status.ts'

/** `api/` root computed from this module's location so the CLI works
 * regardless of the caller's cwd. */
const API_ROOT = fileURLToPath(new URL('../..', import.meta.url))

const SOURCE_LOCALE = 'en'

/** Files that carry a top-level `locales:` allow-list. */
const LOCALE_LIST_FILES = ['meta.yaml', 'datachain-type.yaml']

/**
 * Brief embedded in every catalog so the file is self-contained: hand
 * it to any translator (human or model) without further context.
 */
export const TRANSLATION_BRIEF = `You are localizing DTPR (Digital Trust for Places & Routines), an open taxonomy
used on public signage and disclosures to explain to passers-by how a technology or AI system works:
what it collects, who is accountable, and what rights people have.

Audience: the general public, including people with limited technical or formal education. Write
plainly, the way a well-run city agency writes for residents in this language.

Rules:
- Fill in \`value\` for every entry with the translation of \`en\`. Change nothing else.
- \`context\` says what the string is (element title, category prompt, ...) and where it is shown;
  \`reference\` carries the same string in other locales to disambiguate short titles. English is
  canonical when the two disagree.
- Titles, names and labels are short noun phrases shown under an icon: keep them short, no trailing
  period, and follow the target language's capitalization rules (do not copy English title case).
- Descriptions and prompts are full sentences: keep the meaning and the register, do not add or
  drop information, and keep roughly the same length.
- Use one term per concept across the whole catalog (e.g. the same word for "data", "AI system",
  "accountable", "dataset" everywhere). Decide the term once and reuse it.
- Prefer the established, natural term in the target language over a literal calque. Keep an English
  term only where that is what speakers actually say (e.g. brand-like or technical loanwords).
- "Datachain" is a coined proper noun: leave it untranslated. Leave "DTPR" untranslated.
- Use gender-neutral, inclusive wording where the language allows it without sounding unnatural.
- Keep {{variable}} placeholders and any inline markup exactly as written; never translate them.
- Never leave a \`value\` empty and never return the English unchanged unless it is a proper noun.`

export interface CatalogEntry {
  /** `<file>#<path>` — stable address of a localized field. */
  key: string
  context: string
  en: string
  reference?: Record<string, string>
  value: string
}

export interface Catalog {
  version: string
  source_locale: string
  locale: string
  instructions: string
  entries: CatalogEntry[]
}

export interface TranslateOptions {
  /** Schema source tree. Defaults to `<api>/schemas/`. */
  sourceRoot?: string
  /** Sink for human output; defaults to console. */
  log?: (line: string) => void
}

export interface ExtractOptions extends TranslateOptions {
  /** Where catalogs are written. Defaults to `<api>/.translate/<version>/`. */
  outDir?: string
  /** Emit every field, not just the ones missing the locale (for review passes). */
  all?: boolean
}

export interface ExtractResult {
  ok: boolean
  catalogs: { locale: string; path: string; entries: number }[]
}

export interface ApplyResult {
  ok: boolean
  applied: number
  filesChanged: number
}

interface LocaleEntry {
  locale: string
  value: string
  /** Line range `[start, end)` of the entry in its file. */
  start: number
  end: number
}

interface LocaleBlock {
  path: string
  indent: string
  entries: LocaleEntry[]
}

interface SchemaFile {
  /** Path relative to the version directory, e.g. `elements/camera.yaml`. */
  rel: string
  lines: string[]
  doc: unknown
  blocks: LocaleBlock[]
}

const STATUS_FILE = 'translations.yaml'

export { TranslationStatusSchema, type TranslationStatus }

export interface StatusResult {
  ok: boolean
  locales: { locale: string; status: string; translated: number; total: number; openFlags: number }[]
}

const ENTRY_RE = /^(\s*)- locale: (\S+)\s*$/

function indentOf(line: string): number {
  return line.length - line.trimStart().length
}

function isLocaleValueArray(v: unknown): v is { locale: string; value: string }[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((e) => e !== null && typeof e === 'object' && 'locale' in e && 'value' in e)
  )
}

/** Paths of every localized field, in document order. */
function collectPaths(node: unknown, path: string, out: string[]): void {
  if (isLocaleValueArray(node)) {
    out.push(path)
  } else if (Array.isArray(node)) {
    node.forEach((child, i) => collectPaths(child, `${path}[${i}]`, out))
  } else if (node !== null && typeof node === 'object') {
    for (const [k, child] of Object.entries(node)) {
      collectPaths(child, path ? `${path}.${k}` : k, out)
    }
  }
}

function getAtPath(doc: unknown, path: string): unknown {
  let node = doc as Record<string, unknown> | undefined
  for (const part of path.split(/[.[\]]+/).filter(Boolean)) {
    node = node?.[part] as Record<string, unknown> | undefined
  }
  return node
}

/**
 * Locate localized fields in the raw text. YAML sources are hand-edited,
 * so translations are spliced in line-wise rather than re-dumping the
 * document (which would reflow unrelated lines). Blocks are matched to
 * parsed paths by document order, then cross-checked value by value.
 */
function scanBlocks(rel: string, lines: string[], doc: unknown): LocaleBlock[] {
  const paths: string[] = []
  collectPaths(doc, '', paths)

  const blocks: LocaleBlock[] = []
  let i = 0
  while (i < lines.length) {
    const first = ENTRY_RE.exec(lines[i]!)
    if (!first) {
      i++
      continue
    }
    const indent = first[1]!
    const entries: LocaleEntry[] = []
    while (i < lines.length) {
      const m = ENTRY_RE.exec(lines[i]!)
      if (!m || m[1] !== indent) break
      const start = i++
      while (i < lines.length && (lines[i]!.trim() === '' || indentOf(lines[i]!) > indent.length)) i++
      // Trailing blank lines belong to whatever follows, not to the entry.
      let end = i
      while (end > start + 1 && lines[end - 1]!.trim() === '') end--
      const parsed = yaml.load(lines.slice(start, end).join('\n')) as { value: unknown }[]
      entries.push({ locale: m[2]!, value: String(parsed[0]!.value), start, end })
      i = end
      while (i < lines.length && lines[i]!.trim() === '') i++
    }
    blocks.push({ path: '', indent, entries })
  }

  if (blocks.length !== paths.length) {
    throw new Error(
      `${rel}: found ${blocks.length} localized blocks in text but ${paths.length} in the parsed document`,
    )
  }
  for (const [n, block] of blocks.entries()) {
    block.path = paths[n]!
    const parsed = getAtPath(doc, block.path) as { locale: string; value: string }[]
    const same =
      parsed.length === block.entries.length &&
      parsed.every((e, k) => e.locale === block.entries[k]!.locale && e.value === block.entries[k]!.value)
    if (!same) throw new Error(`${rel}: localized block at '${block.path}' does not match its parsed value`)
  }
  return blocks
}

async function loadFile(versionDir: string, rel: string): Promise<SchemaFile> {
  const text = await readFile(join(versionDir, rel), 'utf8')
  const lines = text.split('\n')
  const doc = yaml.load(text)
  return { rel, lines, doc, blocks: scanBlocks(rel, lines, doc) }
}

async function loadVersion(versionDir: string): Promise<SchemaFile[]> {
  const rels = ['datachain-type.yaml']
  for (const dir of ['categories', 'elements']) {
    const names = (await readdir(join(versionDir, dir))).filter((n) => n.endsWith('.yaml')).sort()
    rels.push(...names.map((n) => `${dir}/${n}`))
  }
  return Promise.all(rels.map((rel) => loadFile(versionDir, rel)))
}

function english(doc: unknown, path: string): string | undefined {
  const values = getAtPath(doc, path)
  return isLocaleValueArray(values) ? values.find((v) => v.locale === SOURCE_LOCALE)?.value : undefined
}

/** One-line description of a field so short strings translate in context. */
function describeField(file: SchemaFile, path: string): string {
  const doc = file.doc as Record<string, unknown>
  const leaf = path.split('.').pop()!
  if (file.rel === 'datachain-type.yaml') {
    if (path.startsWith('subchains')) return 'Name of a group of categories, shown as a section heading'
    return `${leaf === 'name' ? 'Name' : 'Description'} of the disclosure format itself`
  }
  if (file.rel.startsWith('elements/')) {
    const title = english(doc, 'title')
    const what = leaf === 'title' ? 'Title' : `Description of the element "${title}"`
    return `${what} (element in category "${doc.category_id}"); shown under an icon on a public disclosure`
  }
  const category = english(doc, 'name')
  const parent = path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : ''
  const sibling = (field: string) => english(doc, parent ? `${parent}.${field}` : field)
  let what: string
  if (path === 'name') what = 'Category name, shown as a section heading'
  else if (path === 'description') what = 'Category description'
  else if (path === 'prompt') what = 'Question the category answers, shown as a heading to the public'
  else if (path === 'authoring_guidance') what = 'Guidance for the person authoring a disclosure (not shown to the public)'
  else if (leaf === 'label') what = 'Form-field label for a free-text value the author fills in'
  else if (path.includes('values[')) {
    what =
      leaf === 'name'
        ? `Option name within "${english(doc, 'element_context.name')}", shown as a short badge`
        : `Description of the option "${sibling('name')}"`
  } else {
    what =
      leaf === 'name'
        ? 'Name of a qualifier applied to elements in this category'
        : `Description of the qualifier "${sibling('name')}"`
  }
  return `${what} (category "${category}")`
}

function resolveVersionDir(version: string, options: TranslateOptions): { dir: string; canonical: string } {
  const parsed = parseVersion(version)
  const sourceRoot = resolve(options.sourceRoot ?? join(API_ROOT, 'schemas'))
  return { dir: join(sourceRoot, parsed.dir), canonical: parsed.canonical }
}

function checkLocales(locales: string[]): string | null {
  for (const locale of locales) {
    if (locale === SOURCE_LOCALE) return `'${SOURCE_LOCALE}' is the source locale`
    if (!LocaleCodeSchema.safeParse(locale).success) {
      return `locale '${locale}' is not in LocaleCodeSchema (src/schema/locale.ts); add it there first`
    }
  }
  return null
}

/**
 * Write one catalog per target locale listing the localized fields that
 * still lack it. A translator fills in each entry's `value`;
 * `translateApply` writes the result back into the YAML sources.
 */
export async function translateExtract(
  version: string,
  locales: string[],
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const log = options.log ?? ((line: string) => console.log(line))
  const err = (line: string) => (options.log ?? ((l: string) => console.error(l)))(line)

  let target
  try {
    target = resolveVersionDir(version, options)
  } catch (e) {
    if (e instanceof InvalidVersionError) {
      err(`error: ${e.message}`)
      return { ok: false, catalogs: [] }
    }
    throw e
  }
  const bad = checkLocales(locales)
  if (bad || locales.length === 0) {
    err(`error: ${bad ?? 'no target locales given'}`)
    return { ok: false, catalogs: [] }
  }

  const files = await loadVersion(target.dir)
  const outDir = resolve(options.outDir ?? join(API_ROOT, '.translate', target.canonical))
  await mkdir(outDir, { recursive: true })

  const catalogs: ExtractResult['catalogs'] = []
  for (const locale of locales) {
    const path = join(outDir, `${locale}.json`)
    const inProgress = await filledValues(path, target.canonical)
    const entries: CatalogEntry[] = []
    for (const file of files) {
      for (const block of file.blocks) {
        const source = block.entries.find((e) => e.locale === SOURCE_LOCALE)
        if (!source) continue
        const existing = block.entries.find((e) => e.locale === locale)
        if (existing && !options.all) continue
        const reference = Object.fromEntries(
          block.entries
            .filter((e) => e.locale !== SOURCE_LOCALE && e.locale !== locale)
            .map((e) => [e.locale, e.value]),
        )
        entries.push({
          key: `${file.rel}#${block.path}`,
          context: describeField(file, block.path),
          en: source.value,
          ...(Object.keys(reference).length > 0 ? { reference } : {}),
          // The YAML wins for fields it already translates; for the rest, re-extracting
          // must not discard work a translator has not applied yet.
          value: existing?.value ?? inProgress.get(`${file.rel}#${block.path}\n${source.value}`) ?? '',
        })
      }
    }
    const catalog: Catalog = {
      version: target.canonical,
      source_locale: SOURCE_LOCALE,
      locale,
      instructions: TRANSLATION_BRIEF,
      entries,
    }
    await writeFile(path, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
    catalogs.push({ locale, path, entries: entries.length })
    log(`${locale}: ${entries.length} entries → ${path}`)
  }
  return { ok: true, catalogs }
}

/**
 * Filled values of a catalog already on disk for this version, keyed by
 * entry key and English text so a changed source drops the stale value.
 */
async function filledValues(path: string, version: string): Promise<Map<string, string>> {
  const filled = new Map<string, string>()
  let previous: Catalog
  try {
    previous = JSON.parse(await readFile(path, 'utf8')) as Catalog
  } catch {
    return filled
  }
  if (previous.version !== version || !Array.isArray(previous.entries)) return filled
  for (const entry of previous.entries) {
    if (typeof entry.value === 'string' && entry.value.trim() !== '') filled.set(`${entry.key}\n${entry.en}`, entry.value)
  }
  return filled
}

/** `{{variable}}` references in a string, order-insensitive. */
function variables(text: string): string {
  return (text.match(/\{\{[^}]*\}\}/g) ?? []).sort().join(' ')
}

function renderEntry(indent: string, locale: string, value: string): string[] {
  const dumped = yaml.dump([{ locale, value }], {
    lineWidth: Math.max(40, 100 - indent.length),
    noRefs: true,
    quotingType: '"',
  })
  return dumped
    .trimEnd()
    .split('\n')
    .map((line) => (line === '' ? '' : indent + line))
}

/** Append `locale` to a file's top-level `locales:` list if absent. */
function addToLocaleList(lines: string[], locale: string): boolean {
  const head = lines.findIndex((l) => l.trimEnd() === 'locales:')
  if (head === -1) throw new Error("no top-level 'locales:' list")
  let last = head
  for (let i = head + 1; i < lines.length; i++) {
    const m = /^(\s+)- (\S+)\s*$/.exec(lines[i]!)
    if (!m) break
    if (m[2] === locale) return false
    last = i
  }
  const indent = last > head ? lines[last]!.slice(0, indentOf(lines[last]!)) : '  '
  lines.splice(last + 1, 0, `${indent}- ${locale}`)
  return true
}

/**
 * Write filled catalogs back into the YAML sources. Existing entries for
 * the catalog's locale are replaced, so a reviewed catalog can be
 * re-applied. Refuses catalogs whose `en` no longer matches the source.
 */
export async function translateApply(
  version: string,
  catalogPaths: string[],
  options: TranslateOptions = {},
): Promise<ApplyResult> {
  const log = options.log ?? ((line: string) => console.log(line))
  const err = (line: string) => (options.log ?? ((l: string) => console.error(l)))(line)
  const fail: ApplyResult = { ok: false, applied: 0, filesChanged: 0 }

  let target
  try {
    target = resolveVersionDir(version, options)
  } catch (e) {
    if (e instanceof InvalidVersionError) {
      err(`error: ${e.message}`)
      return fail
    }
    throw e
  }
  if (catalogPaths.length === 0) {
    err('error: no catalog files given')
    return fail
  }

  const catalogs: Catalog[] = []
  for (const path of catalogPaths) {
    const catalog = JSON.parse(await readFile(path, 'utf8')) as Catalog
    if (catalog.version !== target.canonical) {
      err(`error: ${path} was extracted from ${catalog.version}, not ${target.canonical}`)
      return fail
    }
    const bad = checkLocales([catalog.locale])
    if (bad) {
      err(`error: ${path}: ${bad}`)
      return fail
    }
    catalogs.push(catalog)
  }

  // Validate every catalog against the current sources before writing anything.
  const problems: string[] = []
  for (const catalog of catalogs) {
    const files = new Map((await loadVersion(target.dir)).map((f) => [f.rel, f]))
    for (const entry of catalog.entries) {
      const [rel, path] = entry.key.split('#') as [string, string]
      const block = files.get(rel)?.blocks.find((b) => b.path === path)
      const source = block?.entries.find((e) => e.locale === SOURCE_LOCALE)
      if (!source) problems.push(`${catalog.locale}: ${entry.key} not found in ${target.canonical}`)
      else if (source.value !== entry.en) problems.push(`${catalog.locale}: ${entry.key} is stale (English changed)`)
      else if (entry.value.trim() === '') problems.push(`${catalog.locale}: ${entry.key} has no translation`)
      else if (variables(entry.value) !== variables(entry.en)) {
        problems.push(`${catalog.locale}: ${entry.key} does not preserve the {{variables}} of the English`)
      }
    }
  }
  // A locale joins the allow-lists only when this apply leaves no field without it.
  const registered = (yaml.load(await readFile(join(target.dir, 'meta.yaml'), 'utf8')) as { locales: string[] }).locales
  const sources = await loadVersion(target.dir)
  for (const catalog of catalogs) {
    if (registered.includes(catalog.locale)) continue
    const covered = new Set(catalog.entries.map((e) => e.key))
    const missing = sources
      .flatMap((f) => f.blocks.map((b) => ({ key: `${f.rel}#${b.path}`, entries: b.entries })))
      .filter((b) => b.entries.some((e) => e.locale === SOURCE_LOCALE))
      .filter((b) => !b.entries.some((e) => e.locale === catalog.locale) && !covered.has(b.key))
    if (missing.length > 0) {
      problems.push(
        `${catalog.locale}: catalog leaves ${missing.length} fields untranslated (first: ${missing[0]!.key}); a new locale must be complete`,
      )
    }
  }
  if (problems.length > 0) {
    for (const p of problems.slice(0, 20)) err(`error: ${p}`)
    if (problems.length > 20) err(`error: … and ${problems.length - 20} more`)
    return fail
  }

  const changed = new Set<string>()
  let applied = 0
  for (const catalog of catalogs) {
    for (const rel of LOCALE_LIST_FILES) {
      const path = join(target.dir, rel)
      const lines = (await readFile(path, 'utf8')).split('\n')
      if (addToLocaleList(lines, catalog.locale)) {
        await writeFile(path, lines.join('\n'), 'utf8')
        changed.add(rel)
      }
    }
    const meta = yaml.load(await readFile(join(target.dir, 'meta.yaml'), 'utf8')) as { locales: string[] }
    const rank = (locale: string) => {
      const i = meta.locales.indexOf(locale)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }

    const byFile = new Map<string, CatalogEntry[]>()
    for (const entry of catalog.entries) {
      const rel = entry.key.split('#')[0]!
      byFile.set(rel, [...(byFile.get(rel) ?? []), entry])
    }
    for (const [rel, entries] of byFile) {
      const file = await loadFile(target.dir, rel)
      const values = new Map(entries.map((e) => [e.key.split('#')[1]!, e.value.trim()]))
      // Splice bottom-up so earlier line numbers stay valid.
      for (const block of [...file.blocks].reverse()) {
        const value = values.get(block.path)
        if (value === undefined) continue
        const rendered = renderEntry(block.indent, catalog.locale, value)
        const existing = block.entries.find((e) => e.locale === catalog.locale)
        if (existing) {
          if (existing.value === value) continue
          file.lines.splice(existing.start, existing.end - existing.start, ...rendered)
        } else {
          const next = block.entries.find((e) => rank(e.locale) > rank(catalog.locale))
          file.lines.splice(next ? next.start : block.entries.at(-1)!.end, 0, ...rendered)
        }
        applied++
        changed.add(rel)
      }
      const text = file.lines.join('\n')
      // Re-scan so a bad splice fails loudly instead of landing on disk.
      scanBlocks(rel, text.split('\n'), yaml.load(text))
      await writeFile(join(target.dir, rel), text, 'utf8')
    }
    log(`${catalog.locale}: applied ${catalog.entries.length} entries`)
  }
  log(`${applied} values written across ${changed.size} files in ${target.canonical}`)
  return { ok: true, applied, filesChanged: changed.size }
}

const TARGET_TYPE_BY_DIR: Record<string, TranslationFlagTarget['type']> = {
  elements: 'element',
  categories: 'category',
}

/**
 * Resolve a flag key (`<file>#<path>`) to the entity it addresses.
 * `id` is the entity's own `id`, read from the file by the caller.
 */
export function flagTarget(key: string, id: string): TranslationFlagTarget {
  const [rel, field] = key.split('#') as [string, string]
  const type = rel === 'datachain-type.yaml' ? 'datachain_type' : TARGET_TYPE_BY_DIR[rel.split('/')[0]!]
  if (!type || !field) throw new Error(`flag key '${key}' does not address a localized field`)
  return { type, id, field }
}

export type TranslationStatusCheck =
  | { kind: 'missing' }
  | { kind: 'invalid'; problems: string[] }
  | {
      kind: 'ok'
      status: TranslationStatus
      /** `status` with each flag's `targets` derived, as emitted to `translations.json`. */
      emitted: EmittedTranslationStatus
      /** Number of localized fields the source locale carries. */
      total: number
      /** Number of those fields that carry `locale`. */
      coverage: (locale: string) => number
    }

/**
 * Read a version's `translations.yaml` and check it against the
 * sources: every target locale has an entry, every flag addresses a
 * field that exists in its locale, and a reviewed locale is complete.
 */
export async function checkTranslationStatus(versionDir: string): Promise<TranslationStatusCheck> {
  let raw: string
  try {
    raw = await readFile(join(versionDir, STATUS_FILE), 'utf8')
  } catch {
    return { kind: 'missing' }
  }
  const parsed = TranslationStatusSchema.safeParse(yaml.load(raw))
  if (!parsed.success) {
    return { kind: 'invalid', problems: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }
  }
  const status = parsed.data

  const files = await loadVersion(versionDir)
  const meta = yaml.load(await readFile(join(versionDir, 'meta.yaml'), 'utf8')) as { locales: string[] }
  const blocks = new Map(files.flatMap((f) => f.blocks.map((b) => [`${f.rel}#${b.path}` as string, b] as const)))
  const ids = new Map(files.map((f) => [f.rel, String((f.doc as { id?: unknown }).id)] as const))
  const total = [...blocks.values()].filter((b) => b.entries.some((e) => e.locale === status.source_locale)).length

  const problems: string[] = []
  const targets = meta.locales.filter((l) => l !== status.source_locale)
  const recorded = status.locales.map((l) => l.locale as string)
  for (const locale of targets) if (!recorded.includes(locale)) problems.push(`locale '${locale}' has no status entry`)
  for (const locale of recorded) if (!targets.includes(locale)) problems.push(`locale '${locale}' is not a target locale in meta.yaml`)
  const flagIds = new Set<string>()
  for (const flag of status.flags) {
    if (flagIds.has(flag.id)) problems.push(`flag id '${flag.id}' is used twice`)
    flagIds.add(flag.id)
    if (!meta.locales.includes(flag.locale)) problems.push(`flag '${flag.id}': locale '${flag.locale}' not in meta.yaml`)
    for (const key of flag.keys) {
      const block = blocks.get(key)
      if (!block) problems.push(`flag '${flag.id}': ${key} not found`)
      else if (!block.entries.some((e) => e.locale === flag.locale)) {
        problems.push(`flag '${flag.id}': ${key} has no '${flag.locale}' entry`)
      }
    }
  }
  const coverage = (locale: string) => [...blocks.values()].filter((b) => b.entries.some((e) => e.locale === locale)).length
  for (const entry of status.locales) {
    const translated = coverage(entry.locale)
    if (entry.status.endsWith('_reviewed') && translated < total) {
      problems.push(`locale '${entry.locale}' is ${entry.status} but only ${translated}/${total} fields are translated`)
    }
  }
  if (problems.length > 0) return { kind: 'invalid', problems }

  const emitted: EmittedTranslationStatus = {
    ...status,
    flags: status.flags.map((flag) => ({
      ...flag,
      targets: flag.keys.map((key) => flagTarget(key, ids.get(key.split('#')[0]!)!)),
    })),
  }
  return { kind: 'ok', status, emitted, total, coverage }
}

/**
 * Check `translations.yaml` against the sources and print per-locale
 * status, coverage and open flags.
 */
export async function translateStatus(version: string, options: TranslateOptions = {}): Promise<StatusResult> {
  const log = options.log ?? ((line: string) => console.log(line))
  const err = (line: string) => (options.log ?? ((l: string) => console.error(l)))(line)
  const fail: StatusResult = { ok: false, locales: [] }

  let target
  try {
    target = resolveVersionDir(version, options)
  } catch (e) {
    if (e instanceof InvalidVersionError) {
      err(`error: ${e.message}`)
      return fail
    }
    throw e
  }

  const check = await checkTranslationStatus(target.dir)
  if (check.kind === 'missing') {
    err(`error: ${target.canonical} has no ${STATUS_FILE}`)
    return fail
  }
  if (check.kind === 'invalid') {
    for (const p of check.problems) err(`error: ${STATUS_FILE}: ${p}`)
    return fail
  }
  const { status, total, coverage } = check

  const locales = status.locales.map((entry) => ({
    locale: entry.locale as string,
    status: entry.status as string,
    translated: coverage(entry.locale),
    total,
    openFlags: status.flags.filter((f) => f.locale === entry.locale && f.status === 'open').length,
  }))
  for (const l of locales) {
    log(`${l.locale.padEnd(8)} ${l.status.padEnd(17)} ${l.translated}/${l.total}  ${l.openFlags} open flags`)
  }
  const sourceFlags = status.flags.filter((f) => f.locale === status.source_locale && f.status === 'open').length
  if (sourceFlags > 0) log(`${status.source_locale.padEnd(8)} ${'source'.padEnd(17)} ${total}/${total}  ${sourceFlags} open flags`)
  return { ok: true, locales }
}
