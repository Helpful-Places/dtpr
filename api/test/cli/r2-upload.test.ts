import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { contentTypeFor, syncTranslations, walkFiles } from '../../scripts/r2-upload.ts'
import { parseVersion } from '../../cli/lib/version-parser.ts'

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

describe('r2-upload: syncTranslations', () => {
  const version = parseVersion('ai@2026-04-16-beta')
  const KEY = 'schemas/ai/2026-04-16-beta/translations.json'
  let distRoot: string

  /** In-memory stand-in for the S3 client: records writes against a key → body map. */
  function fakeClient(objects: Record<string, string>) {
    const writes: string[] = []
    const client = {
      async send(cmd: unknown) {
        if (cmd instanceof GetObjectCommand) {
          const body = objects[cmd.input.Key!]
          if (body === undefined) throw Object.assign(new Error('missing'), { name: 'NoSuchKey' })
          return { Body: { transformToString: async () => body } }
        }
        if (cmd instanceof PutObjectCommand) {
          objects[cmd.input.Key!] = (cmd.input.Body as Buffer).toString('utf8')
          writes.push(`put ${cmd.input.Key} ${cmd.input.ContentType}`)
          return {}
        }
        if (cmd instanceof DeleteObjectCommand) {
          delete objects[cmd.input.Key!]
          writes.push(`delete ${cmd.input.Key}`)
          return {}
        }
        throw new Error('unexpected command')
      },
    } as unknown as S3Client
    return { client, objects, writes }
  }

  const sync = (client: S3Client) =>
    syncTranslations({ version, distRoot, client, bucket: 'b', log: () => {} })

  beforeAll(async () => {
    distRoot = await mkdtemp(join(tmpdir(), 'dtpr-r2-sync-test-'))
    await mkdir(join(distRoot, version.dir), { recursive: true })
  })

  afterAll(async () => {
    if (distRoot) await rm(distRoot, { recursive: true, force: true })
  })

  it('uploads when R2 has no status yet', async () => {
    await writeFile(join(distRoot, version.dir, 'translations.json'), '{"v":1}')
    const r2 = fakeClient({})
    expect(await sync(r2.client)).toBe(true)
    expect(r2.objects[KEY]).toBe('{"v":1}')
    expect(r2.writes).toEqual([`put ${KEY} application/json`])
  })

  it('is a no-op when R2 already holds the same bytes', async () => {
    await writeFile(join(distRoot, version.dir, 'translations.json'), '{"v":1}')
    const r2 = fakeClient({ [KEY]: '{"v":1}' })
    expect(await sync(r2.client)).toBe(false)
    expect(r2.writes).toEqual([])
  })

  it('overwrites when the status changed', async () => {
    await writeFile(join(distRoot, version.dir, 'translations.json'), '{"v":2}')
    const r2 = fakeClient({ [KEY]: '{"v":1}' })
    expect(await sync(r2.client)).toBe(true)
    expect(r2.objects[KEY]).toBe('{"v":2}')
  })

  it('deletes a published status the build no longer emits', async () => {
    await rm(join(distRoot, version.dir, 'translations.json'), { force: true })
    const r2 = fakeClient({ [KEY]: '{"v":1}' })
    expect(await sync(r2.client)).toBe(true)
    expect(r2.objects[KEY]).toBeUndefined()
    expect(r2.writes).toEqual([`delete ${KEY}`])

    const empty = fakeClient({})
    expect(await sync(empty.client)).toBe(false)
    expect(empty.writes).toEqual([])
  })

  it('keeps the published status when the local file cannot be read', async () => {
    // A directory in place of the file: readFile fails with EISDIR, not ENOENT.
    await mkdir(join(distRoot, version.dir, 'translations.json'))
    const r2 = fakeClient({ [KEY]: '{"v":1}' })
    await expect(sync(r2.client)).rejects.toThrow()
    expect(r2.objects[KEY]).toBe('{"v":1}')
    expect(r2.writes).toEqual([])
  })
})
