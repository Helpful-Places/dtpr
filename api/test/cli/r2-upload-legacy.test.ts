import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import type { S3Client } from '@aws-sdk/client-s3'
import { contentTypeFor } from '../../scripts/r2-upload.ts'
import {
  collectLegacyObjects,
  fingerprintObjects,
  LEGACY_FINGERPRINT_KEY,
  s3Store,
  uploadLegacySnapshot,
  type LegacyObjectStore,
} from '../../scripts/r2-upload-legacy.ts'

/**
 * The legacy uploader has no index flip to hide a half-finished run
 * behind, so the properties worth pinning are all about *when* things
 * are written: documents before icons, the sidecar strictly after every
 * put, and nothing at all when the sidecar already matches.
 *
 * Most scenarios run against a miniature artifact staged in tmpdir —
 * small enough to reason about object-by-object. The fan-out scenario
 * runs against the real `api/legacy/` capture, because 148 files
 * becoming 271 objects is a property of that manifest, not of a
 * fixture.
 */

const REAL_LEGACY_ROOT = fileURLToPath(new URL('../../legacy', import.meta.url))

function sha256(text: string): string {
  return `sha256-${createHash('sha256').update(text, 'utf8').digest('hex')}`
}

interface FakeStore extends LegacyObjectStore {
  /** Surviving state, as R2 would hold it across runs. */
  objects: Map<string, { body: string; contentType: string }>
  /** Every put this store accepted, in order. */
  writes: Array<{ key: string; contentType: string; body: string }>
  /** 1-based index of the put that should throw. Infinity = never. */
  failOnPut: number
}

function fakeStore(): FakeStore {
  const store: FakeStore = {
    objects: new Map(),
    writes: [],
    failOnPut: Number.POSITIVE_INFINITY,
    getText(key: string): Promise<string | null> {
      return Promise.resolve(store.objects.get(key)?.body ?? null)
    },
    put(key: string, body: Buffer, contentType: string): Promise<void> {
      if (store.writes.length + 1 >= store.failOnPut) {
        return Promise.reject(new Error(`connection reset while putting ${key}`))
      }
      const text = body.toString('utf8')
      store.writes.push({ key, contentType, body: text })
      store.objects.set(key, { body: text, contentType })
      return Promise.resolve()
    },
  }
  return store
}

interface FixtureSpec {
  /** Document id (`v0/en`, `v1/elements/ai`) → body. */
  documents: Record<string, string>
  /** Icon id → SVG body. */
  icons: Record<string, string>
  v0: string[]
  v1: string[]
}

/** Stage a miniature `api/legacy/` tree with a manifest that agrees with it. */
async function stageFixture(root: string, spec: FixtureSpec): Promise<void> {
  for (const [id, body] of Object.entries(spec.documents)) {
    const path = join(root, 'documents', `${id}.json`)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, body, 'utf8')
  }
  await mkdir(join(root, 'icons'), { recursive: true })
  for (const [id, body] of Object.entries(spec.icons)) {
    await writeFile(join(root, 'icons', `${id}.svg`), body, 'utf8')
  }
  const manifest = {
    captured_at: '2026-08-24T13:16:37.805Z',
    source: 'https://dtpr.io/api/dtpr',
    documents: Object.fromEntries(
      Object.entries(spec.documents).map(([id, body]) => [
        id,
        { sha256: sha256(body), rawSha256: sha256(body) },
      ]),
    ),
    icons: {
      hashes: Object.fromEntries(
        Object.entries(spec.icons).map(([id, body]) => [id, sha256(body)]),
      ),
      v0: spec.v0,
      v1: spec.v1,
    },
    errors: {},
  }
  await writeFile(join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

const SPEC: FixtureSpec = {
  documents: {
    'v0/en': '[{"id":"a","icon":"/api/v0/icons/shared.svg"}]',
    'v1/elements/ai': '{"elements":[{"icon":"/api/v1/icons/only_v1.svg"}]}',
  },
  icons: {
    shared: '<svg id="shared"/>\n',
    also_shared: '<svg id="also_shared"/>\n',
    only_v1: '<svg id="only_v1"/>\n',
  },
  v0: ['also_shared', 'shared'],
  v1: ['also_shared', 'only_v1', 'shared'],
}

/** documents(2) + v0 icons(2) + v1 icons(3). */
const SPEC_OBJECTS = 7

describe('r2-upload-legacy', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'dtpr-legacy-upload-'))
    await stageFixture(root, SPEC)
  })

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true })
  })

  const run = (store: LegacyObjectStore, force = false) =>
    uploadLegacySnapshot({ legacyRoot: root, store, force })

  it('writes every object and then the sidecar, in that order', async () => {
    const store = fakeStore()
    const result = await run(store)

    expect(result.uploaded).toBe(true)
    expect(result.objectCount).toBe(SPEC_OBJECTS)
    expect(store.writes).toHaveLength(SPEC_OBJECTS + 1)
    // The sidecar is the completion marker — it can only be the last write.
    expect(store.writes.at(-1)?.key).toBe(LEGACY_FINGERPRINT_KEY)
    expect(JSON.parse(store.writes.at(-1)!.body)).toMatchObject({
      fingerprint: result.fingerprint,
      objects: SPEC_OBJECTS,
    })
  })

  it('uploads documents before icons', async () => {
    const store = fakeStore()
    await run(store)
    const kinds = store.writes
      .filter((w) => w.key !== LEGACY_FINGERPRINT_KEY)
      .map((w) => (w.key.startsWith('legacy/documents/') ? 'document' : 'icon'))
    // 'document' < 'icon', so the already-sorted form is documents-first.
    expect(kinds).toEqual([...kinds].sort())
    expect(kinds.slice(0, 2)).toEqual(['document', 'document'])
  })

  it('derives keys from the store/keys.ts layout', async () => {
    const store = fakeStore()
    await run(store)
    const keys = store.writes.map((w) => w.key)
    expect(keys).toContain('legacy/documents/v0/en.json')
    expect(keys).toContain('legacy/documents/v1/elements/ai.json')
    expect(keys).toContain('legacy/icons/v0/shared.svg')
    expect(keys).toContain('legacy/icons/v1/only_v1.svg')
  })

  it('performs no writes on a second run of an unchanged artifact', async () => {
    const store = fakeStore()
    await run(store)
    const afterFirst = store.writes.length

    const second = await run(store)
    expect(second.uploaded).toBe(false)
    expect(second.reason).toBe('unchanged')
    expect(store.writes).toHaveLength(afterFirst)
  })

  it('re-uploads a changed document once the sidecar no longer matches', async () => {
    const store = fakeStore()
    const first = await run(store)
    store.writes.length = 0

    // A re-capture rewrites the bytes and the recorded hash together.
    const changed = '[{"id":"a","icon":"/api/v0/icons/shared.svg","title":"new"}]'
    await stageFixture(root, {
      ...SPEC,
      documents: { ...SPEC.documents, 'v0/en': changed },
    })

    const second = await run(store)
    expect(second.uploaded).toBe(true)
    expect(second.fingerprint).not.toBe(first.fingerprint)
    const rewritten = store.writes.find((w) => w.key === 'legacy/documents/v0/en.json')
    expect(rewritten?.body).toBe(changed)
    expect(store.objects.get(LEGACY_FINGERPRINT_KEY)?.body).toContain(second.fingerprint)
  })

  it('re-uploads when only the per-version icon lists change', async () => {
    const store = fakeStore()
    await run(store)
    store.writes.length = 0

    // Same 3 files, one more namespace membership: the fingerprint has
    // to move even though no byte on disk did.
    await stageFixture(root, { ...SPEC, v0: ['also_shared', 'only_v1', 'shared'] })

    const second = await run(store)
    expect(second.uploaded).toBe(true)
    expect(store.writes.map((w) => w.key)).toContain('legacy/icons/v0/only_v1.svg')
  })

  it('writes no sidecar when a run is interrupted, and the next run re-uploads', async () => {
    const store = fakeStore()
    store.failOnPut = SPEC_OBJECTS // die on the last object, before the sidecar
    await expect(run(store)).rejects.toThrow(/connection reset/)

    expect(store.writes).toHaveLength(SPEC_OBJECTS - 1)
    expect(store.objects.has(LEGACY_FINGERPRINT_KEY)).toBe(false)

    store.failOnPut = Number.POSITIVE_INFINITY
    store.writes.length = 0
    const healed = await run(store)
    expect(healed.uploaded).toBe(true)
    expect(store.writes).toHaveLength(SPEC_OBJECTS + 1)
    expect(store.objects.has(LEGACY_FINGERPRINT_KEY)).toBe(true)
  })

  it('re-uploads on --force even when the sidecar matches', async () => {
    const store = fakeStore()
    await run(store)
    store.writes.length = 0

    const forced = await run(store, true)
    expect(forced.uploaded).toBe(true)
    expect(store.writes).toHaveLength(SPEC_OBJECTS + 1)
  })

  it('treats an unreadable sidecar as absent rather than as a wedge', async () => {
    const store = fakeStore()
    await run(store)
    store.objects.set(LEGACY_FINGERPRINT_KEY, { body: 'not json', contentType: 'application/json' })
    store.writes.length = 0

    const healed = await run(store)
    expect(healed.uploaded).toBe(true)
    expect(store.writes).toHaveLength(SPEC_OBJECTS + 1)
  })

  it('serves the contract content types, with no charset parameter', async () => {
    const store = fakeStore()
    await run(store)
    for (const write of store.writes) {
      const expected = write.key.endsWith('.svg') ? 'image/svg+xml' : 'application/json'
      expect(write.contentType, write.key).toBe(expected)
    }
    expect(contentTypeFor('en.json')).toBe('application/json')
    expect(contentTypeFor('shared.svg')).toBe('image/svg+xml')
    expect(contentTypeFor('notes.txt')).toBe('application/octet-stream')
  })

  it('refuses to publish a document whose bytes disagree with the manifest', async () => {
    const store = fakeStore()
    await writeFile(join(root, 'documents', 'v0', 'en.json'), '[{"tampered":true}]', 'utf8')
    await expect(run(store)).rejects.toThrow(/does not match the hash the capture recorded/)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses to publish when the document tree and the manifest disagree', async () => {
    const store = fakeStore()
    await writeFile(join(root, 'documents', 'v0', 'fr.json'), '[]', 'utf8')
    await expect(run(store)).rejects.toThrow(/does not match manifest.documents/)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses to publish an icon file no manifest list references', async () => {
    const store = fakeStore()
    await writeFile(join(root, 'icons', 'stray.svg'), '<svg/>', 'utf8')
    await expect(run(store)).rejects.toThrow(/no manifest list references/)
    expect(store.writes).toHaveLength(0)
  })

  it('fails when a listed icon has no file', async () => {
    const store = fakeStore()
    await rm(join(root, 'icons', 'only_v1.svg'))
    await expect(run(store)).rejects.toThrow(/lists "only_v1" but/)
  })
})

describe('fingerprintObjects', () => {
  it('is independent of the order objects are listed in', () => {
    const a = [
      { key: 'legacy/documents/v0/en.json', sha256: 'sha256-aa' },
      { key: 'legacy/icons/v1/x.svg', sha256: 'sha256-bb' },
    ]
    expect(fingerprintObjects(a)).toBe(fingerprintObjects([...a].reverse()))
  })

  it('moves when a key moves, not only when bytes move', () => {
    const base = [{ key: 'legacy/icons/v1/x.svg', sha256: 'sha256-aa' }]
    const sameBytesNewKey = [{ key: 'legacy/icons/v0/x.svg', sha256: 'sha256-aa' }]
    expect(fingerprintObjects(base)).not.toBe(fingerprintObjects(sameBytesNewKey))
  })
})

describe('s3Store', () => {
  /** Minimal stand-in for the AWS client: records commands, replays answers. */
  function stubClient(answer: (input: Record<string, unknown>) => unknown) {
    const sent: Array<Record<string, unknown>> = []
    const client = {
      send(command: { input: Record<string, unknown> }) {
        sent.push(command.input)
        const result = answer(command.input)
        return result instanceof Error ? Promise.reject(result) : Promise.resolve(result)
      },
    }
    return { sent, client: client as unknown as S3Client }
  }

  it('puts the body and content type under the given bucket', async () => {
    const { sent, client } = stubClient(() => ({}))
    await s3Store(client, 'dtpr-api').put('legacy/icons/v0/x.svg', Buffer.from('<svg/>'), 'image/svg+xml')
    expect(sent).toEqual([
      {
        Bucket: 'dtpr-api',
        Key: 'legacy/icons/v0/x.svg',
        Body: Buffer.from('<svg/>'),
        ContentType: 'image/svg+xml',
      },
    ])
  })

  it('reads a missing sidecar as null rather than throwing', async () => {
    const missing = Object.assign(new Error('no such key'), { name: 'NoSuchKey' })
    const { client } = stubClient(() => missing)
    await expect(s3Store(client, 'dtpr-api').getText(LEGACY_FINGERPRINT_KEY)).resolves.toBeNull()
  })

  it('propagates any other read failure', async () => {
    const { client } = stubClient(() => new Error('AccessDenied'))
    await expect(s3Store(client, 'dtpr-api').getText(LEGACY_FINGERPRINT_KEY)).rejects.toThrow(
      /AccessDenied/,
    )
  })
})

describe('the committed api/legacy artifact', () => {
  it('fans 148 icon files out into 271 objects across the two namespaces', async () => {
    const manifest = JSON.parse(
      await readFile(join(REAL_LEGACY_ROOT, 'manifest.json'), 'utf8'),
    ) as { icons: { v0: string[]; v1: string[]; hashes: Record<string, string> } }

    const objects = await collectLegacyObjects(REAL_LEGACY_ROOT)
    const icons = objects.filter((o) => o.kind === 'icon')

    expect(objects.filter((o) => o.kind === 'document')).toHaveLength(11)
    expect(icons).toHaveLength(271)
    expect(objects).toHaveLength(282)
    // 271 objects, but only 148 distinct files on disk.
    expect(new Set(icons.map((o) => o.source)).size).toBe(148)
    expect(Object.keys(manifest.icons.hashes)).toHaveLength(148)

    const keys = new Set(icons.map((o) => o.key))
    expect(keys.size).toBe(271)
    for (const id of manifest.icons.v0) expect(keys.has(`legacy/icons/v0/${id}.svg`)).toBe(true)
    for (const id of manifest.icons.v1) expect(keys.has(`legacy/icons/v1/${id}.svg`)).toBe(true)

    // R6/R16: the 25 v1-only ids are a genuine 404 under v0, so they
    // must not be written into the v0 namespace by a directory-listing
    // shortcut.
    const v0 = new Set(manifest.icons.v0)
    const v1Only = manifest.icons.v1.filter((id) => !v0.has(id))
    expect(v1Only).toHaveLength(25)
    for (const id of v1Only) expect(keys.has(`legacy/icons/v0/${id}.svg`)).toBe(false)
  })

  it('uploads without tripping any integrity guard, and never touches raw/', async () => {
    const store = fakeStore()
    const result = await uploadLegacySnapshot({ legacyRoot: REAL_LEGACY_ROOT, store })

    expect(result.uploaded).toBe(true)
    expect(result.objectCount).toBe(282)
    expect(store.writes).toHaveLength(283)
    expect(store.writes.at(-1)?.key).toBe(LEGACY_FINGERPRINT_KEY)
    // `raw/` is the conformance fixture set, not published content —
    // and nothing else under `api/legacy/` is publishable either.
    // (Substring matching would not do: `raw_data` is an icon id.)
    const strays = store.writes
      .map((w) => w.key)
      .filter(
        (key) =>
          key !== LEGACY_FINGERPRINT_KEY &&
          !key.startsWith('legacy/documents/') &&
          !key.startsWith('legacy/icons/'),
      )
    expect(strays).toEqual([])
  })
})
