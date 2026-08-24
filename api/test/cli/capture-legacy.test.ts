import { describe, it, expect } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertOnlyIconUrlsChanged,
  canonicalTargets,
  iconIdsIn,
  rewriteIconUrls,
  V0_LOCALES,
} from '../../scripts/capture-legacy.ts'

/**
 * The capture itself runs once against a live service that is being switched
 * off, so it cannot be re-run in CI. These tests exercise the pure rewrite
 * functions and assert the committed artifact's properties — which is what
 * actually has to stay true.
 */

const legacyRoot = fileURLToPath(new URL('../../legacy', import.meta.url))

const readDoc = (id: string, kind: 'raw' | 'documents') =>
  readFile(join(legacyRoot, kind, `${id}.json`), 'utf8')

describe('rewriteIconUrls', () => {
  it('rewrites an icon URL to the version-appropriate namespace', () => {
    const body = '{"icon":"https://dtpr.io/dtpr-icons/aggregated.svg"}'
    expect(rewriteIconUrls(body, '/api/v0/icons')).toBe('{"icon":"/api/v0/icons/aggregated.svg"}')
    expect(rewriteIconUrls(body, '/api/v1/icons')).toBe('{"icon":"/api/v1/icons/aggregated.svg"}')
  })

  it('leaves schema.namespace identifiers untouched', () => {
    // Same host, but a locator vs an identifier. A host-level replace would
    // corrupt 367 of these across the artifact.
    const body = '{"namespace":"https://dtpr.io/schemas/element/v0.2"}'
    expect(rewriteIconUrls(body, '/api/v1/icons')).toBe(body)
  })

  it('rewrites every occurrence, not just the first', () => {
    const body = 'a https://dtpr.io/dtpr-icons/x.svg b https://dtpr.io/dtpr-icons/y.svg'
    expect(rewriteIconUrls(body, '/api/v1/icons')).toBe('a /api/v1/icons/x.svg b /api/v1/icons/y.svg')
  })
})

describe('assertOnlyIconUrlsChanged', () => {
  it('accepts a rewrite that only touched icon URLs', () => {
    const raw = '{"n":"https://dtpr.io/schemas/element/v0.2","i":"https://dtpr.io/dtpr-icons/a.svg"}'
    expect(() => assertOnlyIconUrlsChanged(raw, rewriteIconUrls(raw, '/api/v1/icons'), '/api/v1/icons')).not.toThrow()
  })

  it('rejects a rewrite that changed anything else', () => {
    const raw = '{"n":"https://dtpr.io/schemas/element/v0.2"}'
    const overreaching = raw.replaceAll('https://dtpr.io', '/api/v1')
    expect(() => assertOnlyIconUrlsChanged(raw, overreaching, '/api/v1/icons')).toThrow(/outside icon URLs/)
  })
})

describe('iconIdsIn', () => {
  it('collects distinct icon ids and ignores namespace URLs', () => {
    const body =
      '"https://dtpr.io/dtpr-icons/a.svg" "https://dtpr.io/dtpr-icons/a.svg" ' +
      '"https://dtpr.io/dtpr-icons/b.svg" "https://dtpr.io/schemas/element/v0.2"'
    expect([...iconIdsIn(body)].sort()).toEqual(['a', 'b'])
  })
})

describe('the committed capture', () => {
  it('covers all eleven canonical documents', async () => {
    const targets = canonicalTargets()
    expect(targets).toHaveLength(11)
    for (const { id } of targets) {
      await expect(readDoc(id, 'raw')).resolves.toBeTruthy()
      await expect(readDoc(id, 'documents')).resolves.toBeTruthy()
    }
  })

  it('published documents reverse cleanly to their raw capture', async () => {
    for (const { id } of canonicalTargets()) {
      const iconPath = id.startsWith('v0/') ? '/api/v0/icons' : '/api/v1/icons'
      const raw = await readDoc(id, 'raw')
      const published = await readDoc(id, 'documents')
      expect(() => assertOnlyIconUrlsChanged(raw, published, iconPath)).not.toThrow()
    }
  })

  it('no published document still points at the legacy icon host', async () => {
    for (const { id } of canonicalTargets()) {
      expect(await readDoc(id, 'documents')).not.toContain('dtpr.io/dtpr-icons')
    }
  })

  it('v0 documents point at the v0 namespace and v1 at v1', async () => {
    expect(await readDoc('v0/en', 'documents')).toContain('/api/v0/icons/')
    expect(await readDoc('v0/en', 'documents')).not.toContain('/api/v1/icons/')
    expect(await readDoc('v1/elements', 'documents')).toContain('/api/v1/icons/')
    expect(await readDoc('v1/elements', 'documents')).not.toContain('/api/v0/icons/')
  })

  it('preserves the per-locale record-count asymmetry (plan R10)', async () => {
    const expected: Record<string, number> = { en: 136, fr: 135, es: 135, pt: 133, tl: 134, km: 134 }
    for (const locale of V0_LOCALES) {
      const records = JSON.parse(await readDoc(`v0/${locale}`, 'documents')) as unknown[]
      expect(records, `v0/${locale} record count`).toHaveLength(expected[locale]!)
    }
  })

  it('preserves the absent headline key on every v0 record (plan R10)', async () => {
    for (const locale of V0_LOCALES) {
      const records = JSON.parse(await readDoc(`v0/${locale}`, 'documents')) as Array<Record<string, unknown>>
      expect(records.some((r) => 'headline' in r), `v0/${locale} headline`).toBe(false)
    }
  })

  it('preserves records with neither title nor description outside en (plan R10)', async () => {
    const pt = JSON.parse(await readDoc('v0/pt', 'documents')) as Array<Record<string, unknown>>
    expect(pt.filter((r) => !('title' in r) && !('description' in r)).length).toBeGreaterThan(0)

    const en = JSON.parse(await readDoc('v0/en', 'documents')) as Array<Record<string, unknown>>
    expect(en.every((r) => 'title' in r && 'description' in r)).toBe(true)
  })

  it('captured the filtered variants the locale filter is specified by', async () => {
    const names = await readdir(join(legacyRoot, 'raw', 'variants'))
    // Four typed endpoints x nine query shapes.
    expect(names).toHaveLength(36)
    expect(names).toContain('v1_elements_ai__commas.json')
    expect(names).toContain('v1_categories_device__repeated.json')
  })

  it('captured the error envelopes R4 promises fidelity to', async () => {
    const names = await readdir(join(legacyRoot, 'raw', 'errors'))
    expect(names.sort()).toEqual([
      'categories-bad-type-400.json',
      'elements-bad-type-400.json',
      'elements-filtered-500.json',
      'icon-missing-404.json',
    ])
    const badType = await readFile(join(legacyRoot, 'raw', 'errors', 'elements-bad-type-400.json'), 'utf8')
    expect(badType).toContain('Invalid datachain_type')
    // Two-space pretty-print, no trailing newline — the shape the frozen
    // surface has to reproduce.
    expect(badType).toContain('\n  "statusCode": 400')
    expect(badType.endsWith('}')).toBe(true)
  })

  it('manifest lists v0 as a strict subset of v1 icons', async () => {
    const manifest = JSON.parse(await readFile(join(legacyRoot, 'manifest.json'), 'utf8')) as {
      icons: { v0: string[]; v1: string[]; hashes: Record<string, string> }
    }
    expect(manifest.icons.v0).toHaveLength(123)
    expect(manifest.icons.v1).toHaveLength(148)
    expect(manifest.icons.v0.every((id) => manifest.icons.v1.includes(id))).toBe(true)
    expect(Object.keys(manifest.icons.hashes)).toHaveLength(148)
  })

  it('every icon a document references exists in the artifact', async () => {
    const stored = new Set((await readdir(join(legacyRoot, 'icons'))).map((f) => f.replace(/\.svg$/, '')))
    for (const { id } of canonicalTargets()) {
      for (const iconId of iconIdsIn(await readDoc(id, 'raw'))) {
        expect(stored.has(iconId), `${id} references missing icon ${iconId}`).toBe(true)
      }
    }
  })
})
