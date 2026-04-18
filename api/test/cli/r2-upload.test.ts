import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { contentTypeFor, walkFiles } from '../../scripts/r2-upload.ts'

/**
 * Exercises the key derivation + content-type mapping used by the
 * upload pipeline. We stage a miniature `dist/schemas/<version>/...`
 * tree on disk that mirrors what `schema:build` emits (Unit 3) and
 * assert the script would surface the new SVG files with the right
 * content type.
 */

describe('r2-upload: contentTypeFor', () => {
  it('maps .json to application/json', () => {
    expect(contentTypeFor('manifest.json')).toBe('application/json')
  })

  it('maps .svg to image/svg+xml', () => {
    expect(contentTypeFor('signal.svg')).toBe('image/svg+xml')
    expect(contentTypeFor('icons/accept_deny/dark.svg')).toBe('image/svg+xml')
  })

  it('falls back to application/octet-stream for unknown extensions', () => {
    expect(contentTypeFor('notes.txt')).toBe('application/octet-stream')
    expect(contentTypeFor('bundle.wasm')).toBe('application/octet-stream')
  })
})

describe('r2-upload: walkFiles recurses the dist tree', () => {
  let workDir: string
  let versionDir: string

  beforeAll(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'dtpr-r2-upload-test-'))
    versionDir = join(workDir, 'schemas', 'ai', '2026-04-16-beta')
    await mkdir(versionDir, { recursive: true })
    await mkdir(join(versionDir, 'symbols'), { recursive: true })
    await mkdir(join(versionDir, 'icons', 'accept_deny'), { recursive: true })
    await mkdir(join(versionDir, 'icons', 'cloud_storage'), { recursive: true })
    await mkdir(join(versionDir, 'elements'), { recursive: true })

    await writeFile(join(versionDir, 'manifest.json'), '{}')
    await writeFile(join(versionDir, 'elements.json'), '[]')
    await writeFile(join(versionDir, 'elements', 'accept_deny.json'), '{}')
    await writeFile(join(versionDir, 'symbols', 'accept_deny.svg'), '<svg/>')
    await writeFile(join(versionDir, 'symbols', 'cloud.svg'), '<svg/>')
    await writeFile(join(versionDir, 'icons', 'accept_deny', 'default.svg'), '<svg/>')
    await writeFile(join(versionDir, 'icons', 'accept_deny', 'dark.svg'), '<svg/>')
    await writeFile(join(versionDir, 'icons', 'cloud_storage', 'default.svg'), '<svg/>')
  })

  afterAll(async () => {
    if (workDir) await rm(workDir, { recursive: true, force: true })
  })

  it('surfaces nested SVGs under symbols/ and icons/<element>/', async () => {
    const abs = await walkFiles(versionDir)
    const rel = abs.map((a) => relative(versionDir, a).split(/[\\/]/).join('/')).sort()

    expect(rel).toContain('manifest.json')
    expect(rel).toContain('elements/accept_deny.json')
    expect(rel).toContain('symbols/accept_deny.svg')
    expect(rel).toContain('symbols/cloud.svg')
    expect(rel).toContain('icons/accept_deny/default.svg')
    expect(rel).toContain('icons/accept_deny/dark.svg')
    expect(rel).toContain('icons/cloud_storage/default.svg')
  })

  it('key derivation from relative path produces the expected R2 keys', async () => {
    // Mirror the mapping uploadVersion uses:
    //   key = `schemas/${version.dir}/${rel}`
    const versionDir_id = 'ai/2026-04-16-beta'
    const abs = await walkFiles(versionDir)
    const keys = abs
      .map((a) => relative(versionDir, a).split(/[\\/]/).join('/'))
      .map((rel) => `schemas/${versionDir_id}/${rel}`)

    expect(keys).toContain('schemas/ai/2026-04-16-beta/symbols/accept_deny.svg')
    expect(keys).toContain('schemas/ai/2026-04-16-beta/icons/accept_deny/dark.svg')
    expect(keys).toContain('schemas/ai/2026-04-16-beta/icons/cloud_storage/default.svg')
  })

  it('every surfaced SVG would upload with Content-Type: image/svg+xml', async () => {
    const abs = await walkFiles(versionDir)
    const svgs = abs
      .map((a) => relative(versionDir, a).split(/[\\/]/).join('/'))
      .filter((rel) => rel.endsWith('.svg'))
    expect(svgs.length).toBeGreaterThan(0)
    for (const rel of svgs) {
      expect(contentTypeFor(rel)).toBe('image/svg+xml')
    }
  })
})
