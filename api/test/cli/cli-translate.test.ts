import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import {
  flagTarget,
  translateApply,
  translateExtract,
  translateStatus,
  type Catalog,
} from '../../cli/commands/translate.ts'
import { build, validateCmd } from '../../cli/commands/build.ts'

/**
 * Exercises `schema:translate extract|apply` end-to-end against a
 * scratch copy of the committed fixture. Every test writes to a fresh
 * tmpdir so runs are independent.
 */

const fixtureRoot = fileURLToPath(new URL('../fixtures/schemas', import.meta.url))
const VERSION = 'ai@2026-04-16-beta'

const logs: string[] = []
const log = (line: string) => {
  logs.push(line)
}

let scratch: string
let outDir: string

const versionFile = (rel: string) => join(scratch, 'ai', '2026-04-16-beta', rel)
const readYaml = async (rel: string) => yaml.load(await readFile(versionFile(rel), 'utf8')) as any
const readCatalog = async (locale: string) =>
  JSON.parse(await readFile(join(outDir, `${locale}.json`), 'utf8')) as Catalog

/** Extract a catalog and fill every entry with `fill(en)`. */
async function filledCatalog(locale: string, fill: (en: string) => string): Promise<string> {
  await translateExtract(VERSION, [locale], { sourceRoot: scratch, outDir, log })
  const catalog = await readCatalog(locale)
  for (const entry of catalog.entries) entry.value = fill(entry.en)
  const path = join(outDir, `${locale}.json`)
  await writeFile(path, JSON.stringify(catalog), 'utf8')
  return path
}

beforeEach(async () => {
  logs.length = 0
  scratch = await mkdtemp(join(tmpdir(), 'dtpr-cli-translate-'))
  outDir = join(scratch, '_catalogs')
  await cp(fixtureRoot, scratch, { recursive: true })
})

afterEach(async () => {
  if (scratch) await rm(scratch, { recursive: true, force: true })
})

describe('schema:translate extract', () => {
  it('lists every localized field missing the target locale', async () => {
    const result = await translateExtract(VERSION, ['fr'], { sourceRoot: scratch, outDir, log })
    expect(result.ok).toBe(true)

    const catalog = await readCatalog('fr')
    expect(catalog.version).toBe(VERSION)
    expect(catalog.locale).toBe('fr')
    expect(catalog.instructions).toContain('DTPR')
    expect(result.catalogs[0]!.entries).toBe(catalog.entries.length)

    const title = catalog.entries.find((e) => e.key === 'elements/accept_deny.yaml#title')!
    expect(title.en).toBe('Accept or deny')
    expect(title.value).toBe('')
    expect(title.context).toContain('ai__decision')
    expect(catalog.entries.some((e) => e.key === 'datachain-type.yaml#name')).toBe(true)
    expect(catalog.entries.some((e) => e.key.startsWith('categories/'))).toBe(true)
  })

  it('keeps values already filled in when a catalog is extracted again', async () => {
    const path = await filledCatalog('fr', (en) => `FR ${en}`)
    const before = await readCatalog('fr')
    before.entries[0]!.value = ''
    await writeFile(path, JSON.stringify(before), 'utf8')

    await translateExtract(VERSION, ['fr'], { sourceRoot: scratch, outDir, log })
    const after = await readCatalog('fr')
    expect(after.entries[0]!.value).toBe('')
    expect(after.entries.slice(1).every((e) => e.value === `FR ${e.en}`)).toBe(true)
  })

  it('prefers the YAML over an older catalog for fields already translated', async () => {
    const path = await filledCatalog('fr', (en) => `OLD ${en}`)
    const stale = await readFile(path, 'utf8')
    const fresh = JSON.parse(stale) as Catalog
    for (const entry of fresh.entries) entry.value = `NEW ${entry.en}`
    await writeFile(path, JSON.stringify(fresh), 'utf8')
    await translateApply(VERSION, [path], { sourceRoot: scratch, log })
    await writeFile(path, stale, 'utf8')

    await translateExtract(VERSION, ['fr'], { sourceRoot: scratch, outDir, log, all: true })
    expect((await readCatalog('fr')).entries.every((e) => e.value === `NEW ${e.en}`)).toBe(true)
  })

  it('rejects the source locale and locales outside LocaleCodeSchema', async () => {
    for (const locale of ['en', 'xx']) {
      const result = await translateExtract(VERSION, [locale], { sourceRoot: scratch, outDir, log })
      expect(result.ok).toBe(false)
    }
  })
})

describe('schema:translate apply', () => {
  it('writes translations into the YAML and registers the locale', async () => {
    const before = await readFile(versionFile('elements/accept_deny.yaml'), 'utf8')
    const path = await filledCatalog('fr', (en) => `FR ${en}`)

    const result = await translateApply(VERSION, [path], { sourceRoot: scratch, log })
    expect(result.ok).toBe(true)

    const element = await readYaml('elements/accept_deny.yaml')
    expect(element.title).toEqual([
      { locale: 'en', value: 'Accept or deny' },
      { locale: 'fr', value: 'FR Accept or deny' },
    ])
    expect((await readYaml('meta.yaml')).locales).toEqual(['en', 'fr'])
    expect((await readYaml('datachain-type.yaml')).locales).toEqual(['en', 'fr'])

    // Insert-only: stripping the added lines gives back the original file.
    const after = await readFile(versionFile('elements/accept_deny.yaml'), 'utf8')
    const stripped = after
      .split('\n')
      .filter((line, i, all) => !/locale: fr$/.test(line) && !/locale: fr$/.test(all[i - 1] ?? ''))
      .join('\n')
    expect(stripped).toBe(before)

    expect((await validateCmd(VERSION, { sourceRoot: scratch, log })).ok).toBe(true)
    // Nothing left to translate.
    await translateExtract(VERSION, ['fr'], { sourceRoot: scratch, outDir, log })
    expect((await readCatalog('fr')).entries).toEqual([])
  })

  it('replaces existing values when a revised catalog is re-applied', async () => {
    await translateApply(VERSION, [await filledCatalog('fr', (en) => `FR ${en}`)], { sourceRoot: scratch, log })

    await translateExtract(VERSION, ['fr'], { sourceRoot: scratch, outDir, log, all: true })
    const catalog = await readCatalog('fr')
    expect(catalog.entries.every((e) => e.value.startsWith('FR '))).toBe(true)
    const path = join(outDir, 'fr.json')
    catalog.entries.find((e) => e.key === 'elements/accept_deny.yaml#title')!.value = 'Accepter ou refuser'
    await writeFile(path, JSON.stringify(catalog), 'utf8')

    const result = await translateApply(VERSION, [path], { sourceRoot: scratch, log })
    expect(result).toMatchObject({ ok: true, applied: 1, filesChanged: 1 })
    expect((await readYaml('elements/accept_deny.yaml')).title[1]).toEqual({
      locale: 'fr',
      value: 'Accepter ou refuser',
    })
  })

  it('keeps entries in manifest locale order and round-trips awkward strings', async () => {
    const tricky = 'Qui décide : « oui » ou "non" ? # 100%'
    await translateApply(VERSION, [await filledCatalog('fr', (en) => (en.includes('{{') ? en : tricky))], { sourceRoot: scratch, log })
    await translateApply(VERSION, [await filledCatalog('zh-Hant', (en) => (en.includes('{{') ? en : '接受或拒絕'))], { sourceRoot: scratch, log })

    const element = await readYaml('elements/accept_deny.yaml')
    expect(element.title.map((v: { locale: string }) => v.locale)).toEqual(['en', 'fr', 'zh-Hant'])
    expect(element.title[1].value).toBe(tricky)
    expect(element.description[2].value).toBe('接受或拒絕')
  })

  it('refuses stale, incomplete or variable-dropping catalogs without touching the sources', async () => {
    const before = await readFile(versionFile('elements/accept_deny.yaml'), 'utf8')

    const empty = await filledCatalog('fr', () => '')
    expect((await translateApply(VERSION, [empty], { sourceRoot: scratch, log })).ok).toBe(false)

    const stale = await filledCatalog('fr', (en) => `FR ${en}`)
    const catalog = await readCatalog('fr')
    catalog.entries[0]!.en = 'Something the source no longer says'
    await writeFile(stale, JSON.stringify(catalog), 'utf8')
    expect((await translateApply(VERSION, [stale], { sourceRoot: scratch, log })).ok).toBe(false)
    expect(logs.some((l) => l.includes('stale'))).toBe(true)

    const dropped = await filledCatalog('fr', (en) => `FR ${en}`)
    const withVariable = await readCatalog('fr')
    withVariable.entries[0]!.value = 'Conservé {{jours}} jours'
    await writeFile(dropped, JSON.stringify(withVariable), 'utf8')
    expect((await translateApply(VERSION, [dropped], { sourceRoot: scratch, log })).ok).toBe(false)

    expect(await readFile(versionFile('elements/accept_deny.yaml'), 'utf8')).toBe(before)
    expect((await readYaml('meta.yaml')).locales).toEqual(['en'])
  })
})

describe('schema:translate apply: new locales', () => {
  it('refuses to register a locale from a partial catalog', async () => {
    const path = await filledCatalog('fr', (en) => `FR ${en}`)
    const catalog = await readCatalog('fr')
    catalog.entries.pop()
    await writeFile(path, JSON.stringify(catalog), 'utf8')

    expect((await translateApply(VERSION, [path], { sourceRoot: scratch, log })).ok).toBe(false)
    expect(logs.some((l) => l.includes('a new locale must be complete'))).toBe(true)
    expect((await readYaml('meta.yaml')).locales).toEqual(['en'])
  })
})

describe('schema:translate status', () => {
  const statusYaml = (key: string) => `source_locale: en
locales:
  - locale: fr
    status: machine_draft
    updated_at: "2026-10-05"
    summary: Draft.
flags:
  - id: fr-accept
    locale: fr
    kind: term_choice
    status: open
    raised_by: reviewer
    keys:
      - ${key}
    note: Check the verb.
`

  it('reports status, coverage and open flags per locale', async () => {
    await translateApply(VERSION, [await filledCatalog('fr', (en) => `FR ${en}`)], { sourceRoot: scratch, log })
    await writeFile(versionFile('translations.yaml'), statusYaml('elements/accept_deny.yaml#title'), 'utf8')

    const result = await translateStatus(VERSION, { sourceRoot: scratch, log })
    expect(result.ok).toBe(true)
    expect(result.locales).toHaveLength(1)
    expect(result.locales[0]).toMatchObject({ locale: 'fr', status: 'machine_draft', openFlags: 1 })
    expect(result.locales[0]!.translated).toBe(result.locales[0]!.total)
    // The extra file does not disturb the schema build.
    expect((await validateCmd(VERSION, { sourceRoot: scratch, log })).ok).toBe(true)
  })

  it('rejects flags that point at missing fields and locales without a status entry', async () => {
    await translateApply(VERSION, [await filledCatalog('fr', (en) => `FR ${en}`)], { sourceRoot: scratch, log })
    await writeFile(versionFile('translations.yaml'), statusYaml('elements/nope.yaml#title'), 'utf8')
    expect((await translateStatus(VERSION, { sourceRoot: scratch, log })).ok).toBe(false)

    await translateApply(VERSION, [await filledCatalog('es', (en) => `ES ${en}`)], { sourceRoot: scratch, log })
    await writeFile(versionFile('translations.yaml'), statusYaml('elements/accept_deny.yaml#title'), 'utf8')
    expect((await translateStatus(VERSION, { sourceRoot: scratch, log })).ok).toBe(false)
    expect(logs.some((l) => l.includes("locale 'es' has no status entry"))).toBe(true)
  })

  it('rejects a reviewed status on a locale with missing translations', async () => {
    await translateApply(VERSION, [await filledCatalog('fr', (en) => `FR ${en}`)], { sourceRoot: scratch, log })
    const element = versionFile('elements/accept_deny.yaml')
    const text = await readFile(element, 'utf8')
    await writeFile(element, text.replace(/  - locale: fr\n    value: FR Accept or deny\n/, ''), 'utf8')
    const reviewed = statusYaml('elements/cloud_storage.yaml#title').replace('machine_draft', 'machine_reviewed')
    await writeFile(versionFile('translations.yaml'), reviewed, 'utf8')

    expect((await translateStatus(VERSION, { sourceRoot: scratch, log })).ok).toBe(false)
    expect(logs.some((l) => l.includes('is machine_reviewed but only'))).toBe(true)
  })

  it('accepts the committed status file of every version that has one', async () => {
    const result = await translateStatus('dtpr@2026-09-01-beta', { log })
    expect(result.ok).toBe(true)
  })
})

describe('schema:build with translations.yaml', () => {
  const statusYaml = (keys: string[]) => `source_locale: en
locales:
  - locale: fr
    status: machine_draft
    updated_at: "2026-10-05"
    summary: Draft.
flags:
  - id: fr-flag
    locale: fr
    kind: term_choice
    status: open
    raised_by: reviewer
    keys:
${keys.map((k) => `      - ${k}`).join('\n')}
    note: Check.
`
  const buildScratch = () => build(VERSION, { sourceRoot: scratch, outputRoot: join(scratch, '_dist'), log })
  const emitted = (file: string) => readFile(join(scratch, '_dist', 'ai', '2026-04-16-beta', file), 'utf8')

  it('derives a target from each kind of flag key', () => {
    expect(flagTarget('elements/accept_deny.yaml#title', 'accept_deny')).toEqual({
      type: 'element',
      id: 'accept_deny',
      field: 'title',
    })
    expect(flagTarget('categories/ai__decision.yaml#element_context.values[0].name', 'ai__decision')).toEqual({
      type: 'category',
      id: 'ai__decision',
      field: 'element_context.values[0].name',
    })
    expect(flagTarget('datachain-type.yaml#name', 'ai')).toEqual({ type: 'datachain_type', id: 'ai', field: 'name' })
    expect(() => flagTarget('symbols/cloud.svg#title', 'cloud')).toThrow()
  })

  it('emits translations.json with targets, outside the content hash', async () => {
    await translateApply(VERSION, [await filledCatalog('fr', (en) => `FR ${en}`)], { sourceRoot: scratch, log })
    expect((await buildScratch()).ok).toBe(true)
    await expect(emitted('translations.json')).rejects.toThrow()
    const hashBefore = JSON.parse(await emitted('manifest.json')).content_hash

    const keys = ['elements/accept_deny.yaml#title', 'categories/ai__decision.yaml#name', 'datachain-type.yaml#name']
    await writeFile(versionFile('translations.yaml'), statusYaml(keys), 'utf8')
    expect((await buildScratch()).ok).toBe(true)

    const doc = JSON.parse(await emitted('translations.json'))
    expect(doc.source_locale).toBe('en')
    expect(doc.locales[0]).toMatchObject({ locale: 'fr', status: 'machine_draft' })
    expect(doc.flags[0].keys).toEqual(keys)
    expect(doc.flags[0].targets).toEqual([
      { type: 'element', id: 'accept_deny', field: 'title' },
      { type: 'category', id: 'ai__decision', field: 'name' },
      { type: 'datachain_type', id: 'ai', field: 'name' },
    ])
    expect(JSON.parse(await emitted('manifest.json')).content_hash).toBe(hashBefore)
  })

  it('reports a YAML syntax error as a status problem instead of throwing', async () => {
    await writeFile(versionFile('translations.yaml'), 'source_locale: en\nlocales: [\n', 'utf8')
    const result = await buildScratch()
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.includes('TRANSLATION_STATUS') && l.includes('YAML syntax error'))).toBe(true)
    expect((await translateStatus(VERSION, { sourceRoot: scratch, log })).ok).toBe(false)
  })

  it('fails the build when a flag points at a missing field', async () => {
    await translateApply(VERSION, [await filledCatalog('fr', (en) => `FR ${en}`)], { sourceRoot: scratch, log })
    await writeFile(versionFile('translations.yaml'), statusYaml(['elements/nope.yaml#title']), 'utf8')
    const result = await buildScratch()
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.includes('TRANSLATION_STATUS') && l.includes('elements/nope.yaml#title not found'))).toBe(true)
  })
})
