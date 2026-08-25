/**
 * CI helper: publish the frozen legacy snapshot (`api/legacy/`) to R2.
 *
 * A second uploader rather than a generalisation of `r2-upload.ts`
 * (KTD6). That script is built around three ideas this artifact does
 * not have: a per-version `manifest.json` carrying a `content_hash`, an
 * immutability rule that fails the build when a stable version's bytes
 * change, and a final `schemas/index.json` rewrite. The legacy snapshot
 * has no version directory to parse, no promotion path, and no index.
 *
 * Completion contract:
 *   1. Every object is written — the 11 documents first, then the 271
 *      icon objects. Documents lead because they are what a client asks
 *      for first, and an icon that lands before the document naming it
 *      is unreachable anyway.
 *   2. The sidecar at `legacy/upload-fingerprint.json` is written LAST,
 *      after every put has resolved. It is the "this run finished"
 *      marker and nothing but this script reads it, so a run that dies
 *      mid-upload leaves the previous (or no) fingerprint behind and
 *      the next deploy uploads the whole set again.
 *
 * There is no index flip to hide a partial upload behind: a missing
 * object is directly visible as a legacy 404. The post-deploy smoke
 * tests are the net — they fetch all 282 objects through the Worker and
 * compare each against the hash the capture recorded.
 *
 * Idempotency:
 *   - The fingerprint covers every (key, sha256) pair the run intends
 *     to write, so an unchanged artifact is a no-op, and any change —
 *     new bytes, a new document, a changed per-version icon list —
 *     republishes the whole set.
 *   - Per-object skipping is deliberately absent: it would cost 282
 *     HEAD round trips on every deploy to save a rare re-put, and the
 *     artifact is frozen, so the common case is "nothing to do at all".
 *
 * Integrity:
 *   The bytes on disk are hashed and checked against
 *   `api/legacy/manifest.json` before anything is written, and the
 *   document tree must match `manifest.documents` exactly. The smoke
 *   tests compare the *served* bytes against those same hashes, so a
 *   disagreement is better caught here — before publication — than
 *   after.
 *
 * Required env vars (same block as `r2-upload.ts`):
 *   R2_ACCOUNT_ID            Cloudflare account UUID
 *   R2_ACCESS_KEY_ID         R2 S3 access key (Object Read & Write scope)
 *   R2_SECRET_ACCESS_KEY     paired secret
 *   R2_BUCKET                target bucket (e.g. `dtpr-api`, `dtpr-api-preview`)
 *
 * Usage:
 *   tsx scripts/r2-upload-legacy.ts [--legacy <path>] [--force]
 */

import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  LEGACY_VERSIONS,
  legacyDocumentKey,
  legacyIconKey,
  type LegacyVersion,
} from '../src/store/keys.ts'
// Shared with the schema uploader rather than re-declared. That script
// pulls in only node built-ins, the S3 client this one already imports,
// and a zero-dependency version parser — no route module, so none of
// the Hono graph this script deliberately stays out of comes with it.
import { contentTypeFor, requireEnv, walkFiles } from './r2-upload.ts'

const API_ROOT = fileURLToPath(new URL('..', import.meta.url))

/** The committed capture. Overridable with `--legacy` for tests. */
export const DEFAULT_LEGACY_ROOT = join(API_ROOT, 'legacy')

/**
 * Completion marker for the snapshot as a whole.
 *
 * Lives under the `legacy/` prefix but outside both served sub-trees
 * (`legacy/documents/…`, `legacy/icons/…`), so no route can reach it
 * and no route can be shadowed by it.
 */
export const LEGACY_FINGERPRINT_KEY = 'legacy/upload-fingerprint.json'

/**
 * The parts of `api/legacy/manifest.json` this script reads.
 *
 * Narrower than the `LegacyManifest` in `test/api/legacy-fixtures.ts`
 * on purpose: the uploader has no use for `errors` or `rawSha256`, and
 * a type describing only what it consumes cannot drift on fields it
 * ignores.
 */
interface LegacyManifest {
  /** Keyed by document id: `v0/en`, `v1/elements/ai`, … */
  documents: Record<string, { sha256: string }>
  icons: {
    /** sha256 per icon id, shared by both majors. */
    hashes: Record<string, string>
    /** The 123 icon ids v0 references. */
    v0: string[]
    /** The 148 icon ids v1 references. */
    v1: string[]
  }
}

/** One R2 object this run intends to write. */
export interface LegacyObject {
  /** `document` objects are uploaded before `icon` objects. */
  kind: 'document' | 'icon'
  /** R2 key, always from the builders in `src/store/keys.ts`. */
  key: string
  /** Path of the file whose bytes go to `key`, relative to the root. */
  source: string
  /** `sha256-<hex>` over those bytes, in the manifest's format. */
  sha256: string
  contentType: string
  bytes: Buffer
}

/**
 * The subset of R2 this script needs, so tests can drive it without a
 * bucket. `s3Store` is the only production implementation.
 */
export interface LegacyObjectStore {
  /** Object body as text, or `null` when the key does not exist. */
  getText(key: string): Promise<string | null>
  put(key: string, body: Buffer, contentType: string): Promise<void>
}

const JSON_SUFFIX = '.json'
const SVG_SUFFIX = '.svg'

function sha256(bytes: Buffer): string {
  return `sha256-${createHash('sha256').update(bytes).digest('hex')}`
}

function isLegacyVersion(value: string | undefined): value is LegacyVersion {
  return value !== undefined && (LEGACY_VERSIONS as readonly string[]).includes(value)
}

/**
 * The 11 published documents, as a straight walk of
 * `api/legacy/documents/` — the tree mirrors the key layout, so
 * `<major>/<path>.json` on disk is `legacy/documents/<major>/<path>.json`
 * in R2.
 *
 * The walk is the inventory and the manifest is the check: they must
 * name exactly the same ids, and each file must hash to what the
 * capture recorded. Either mismatch means the artifact is half
 * re-captured or corrupt in the checkout, which is a stop-before-write
 * condition rather than something to publish.
 */
async function collectDocuments(
  legacyRoot: string,
  manifest: LegacyManifest,
): Promise<LegacyObject[]> {
  const documentsRoot = join(legacyRoot, 'documents')
  const byId = new Map<string, LegacyObject>()

  for (const abs of await walkFiles(documentsRoot)) {
    const rel = relative(documentsRoot, abs).split(/[\\/]/).join('/')
    if (!rel.endsWith(JSON_SUFFIX)) {
      throw new Error(`Unexpected non-JSON file in the legacy document tree: documents/${rel}`)
    }
    const id = rel.slice(0, -JSON_SUFFIX.length)
    const [version, ...rest] = id.split('/')
    if (!isLegacyVersion(version) || rest.length === 0) {
      throw new Error(
        `Legacy document documents/${rel} is not under a known major ` +
          `(${LEGACY_VERSIONS.join(', ')}) — refusing to guess a key for it.`,
      )
    }
    const bytes = await readFile(abs)
    byId.set(id, {
      kind: 'document',
      key: legacyDocumentKey(version, rest.join('/')),
      source: `documents/${rel}`,
      sha256: sha256(bytes),
      contentType: contentTypeFor(rel),
      bytes,
    })
  }

  const expected = Object.keys(manifest.documents).sort()
  const found = [...byId.keys()].sort()
  if (found.join(',') !== expected.join(',')) {
    throw new Error(
      `Legacy document tree does not match manifest.documents.\n` +
        `  on disk : ${found.join(', ') || '(none)'}\n` +
        `  manifest: ${expected.join(', ') || '(none)'}`,
    )
  }

  return expected.map((id) => {
    const object = byId.get(id)!
    const recorded = manifest.documents[id]!.sha256
    if (object.sha256 !== recorded) {
      throw new Error(
        `Legacy document ${id} does not match the hash the capture recorded ` +
          `(${object.sha256} != ${recorded}). Re-run \`pnpm --filter ./api capture:legacy\` ` +
          `or restore the artifact — do not publish bytes the manifest disowns.`,
      )
    }
    return object
  })
}

/**
 * The icon fan-out: 148 files on disk become 271 R2 objects, because
 * each major gets its own namespace and the two share 123 ids (R6).
 *
 * `manifest.icons.v0` / `.v1` decide which namespace a file is written
 * to — never the directory listing, which cannot distinguish the 25
 * v1-only ids from the shared ones. A v1-only id under `v0/` would be
 * a silent widening of the v0 surface, so the lists are the authority
 * and an unreferenced file is an error rather than a spare.
 */
async function collectIcons(
  legacyRoot: string,
  manifest: LegacyManifest,
): Promise<LegacyObject[]> {
  const iconsRoot = join(legacyRoot, 'icons')
  const referenced = new Set([...manifest.icons.v0, ...manifest.icons.v1])

  const onDisk = await readdir(iconsRoot)
  const orphans = onDisk
    .filter((name) => name.endsWith(SVG_SUFFIX))
    .map((name) => name.slice(0, -SVG_SUFFIX.length))
    .filter((id) => !referenced.has(id))
    .sort()
  if (orphans.length > 0) {
    throw new Error(
      `icons/ holds ${orphans.length} file(s) no manifest list references ` +
        `(${orphans.join(', ')}). The manifest is the inventory — a file it does not ` +
        `name has no namespace to be published under.`,
    )
  }

  const loaded = new Map<string, { bytes: Buffer; sha256: string }>()
  const objects: LegacyObject[] = []

  for (const version of LEGACY_VERSIONS) {
    for (const id of [...manifest.icons[version]].sort()) {
      let icon = loaded.get(id)
      if (icon === undefined) {
        const path = join(iconsRoot, `${id}${SVG_SUFFIX}`)
        let bytes: Buffer
        try {
          bytes = await readFile(path)
        } catch {
          throw new Error(
            `manifest.icons.${version} lists "${id}" but ${relative(legacyRoot, path)} is missing.`,
          )
        }
        const digest = sha256(bytes)
        const recorded = manifest.icons.hashes[id]
        if (recorded === undefined) {
          throw new Error(`No sha256 recorded for icon "${id}" in manifest.icons.hashes.`)
        }
        if (digest !== recorded) {
          throw new Error(
            `Icon ${id} does not match the hash the capture recorded ` +
              `(${digest} != ${recorded}). Restore the artifact — do not publish bytes ` +
              `the manifest disowns.`,
          )
        }
        icon = { bytes, sha256: digest }
        loaded.set(id, icon)
      }
      objects.push({
        kind: 'icon',
        key: legacyIconKey(version, id),
        source: `icons/${id}${SVG_SUFFIX}`,
        sha256: icon.sha256,
        contentType: contentTypeFor(`${id}${SVG_SUFFIX}`),
        bytes: icon.bytes,
      })
    }
  }

  return objects
}

/**
 * Every object the run will write, documents first. Throws rather than
 * returning a partial inventory: a snapshot that disagrees with its own
 * manifest must not be published at all.
 */
export async function collectLegacyObjects(legacyRoot: string): Promise<LegacyObject[]> {
  const manifestText = await readFile(join(legacyRoot, 'manifest.json'), 'utf8')
  const manifest = JSON.parse(manifestText) as LegacyManifest
  return [
    ...(await collectDocuments(legacyRoot, manifest)),
    ...(await collectIcons(legacyRoot, manifest)),
  ]
}

/**
 * Fingerprint of the whole intended write set.
 *
 * Over (key, content-hash) pairs, not over the files: that way a change
 * to the per-version icon lists — same 148 files, different fan-out —
 * moves the fingerprint too. Sorted, so it does not depend on upload
 * order.
 */
export function fingerprintObjects(
  objects: readonly Pick<LegacyObject, 'key' | 'sha256'>[],
): string {
  const hash = createHash('sha256')
  const sorted = [...objects].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  for (const { key, sha256: digest } of sorted) hash.update(`${key}\n${digest}\n`)
  return `sha256-${hash.digest('hex')}`
}

/**
 * Read the fingerprint the last completed run left behind.
 *
 * An unreadable sidecar is treated as absent rather than as an error: a
 * corrupt marker must never be able to wedge the snapshot into a state
 * where re-uploading is impossible.
 */
async function readFingerprint(
  store: LegacyObjectStore,
  log: (line: string) => void,
): Promise<string | null> {
  const text = await store.getText(LEGACY_FINGERPRINT_KEY)
  if (text === null) return null
  try {
    const parsed = JSON.parse(text) as { fingerprint?: unknown }
    if (typeof parsed.fingerprint === 'string') return parsed.fingerprint
  } catch {
    // fall through
  }
  log(`Sidecar ${LEGACY_FINGERPRINT_KEY} is not a readable fingerprint — treating as absent.`)
  return null
}

export interface UploadLegacyOptions {
  store: LegacyObjectStore
  /** Defaults to `api/legacy`. */
  legacyRoot?: string
  log?: (line: string) => void
  /** Re-put every object even when the sidecar already matches. */
  force?: boolean
}

export interface UploadLegacyResult {
  uploaded: boolean
  reason: 'unchanged' | 'published'
  fingerprint: string
  objectCount: number
  documentCount: number
  iconCount: number
}

export async function uploadLegacySnapshot(
  opts: UploadLegacyOptions,
): Promise<UploadLegacyResult> {
  const { store } = opts
  const legacyRoot = opts.legacyRoot ?? DEFAULT_LEGACY_ROOT
  const log = opts.log ?? (() => {})

  const objects = await collectLegacyObjects(legacyRoot)
  const documentCount = objects.filter((o) => o.kind === 'document').length
  const iconCount = objects.length - documentCount
  const fingerprint = fingerprintObjects(objects)
  const counts = { fingerprint, objectCount: objects.length, documentCount, iconCount }

  if (opts.force) {
    log(`--force: republishing ${objects.length} objects at ${fingerprint}.`)
  } else {
    const published = await readFingerprint(store, log)
    if (published === fingerprint) {
      log(`No-op: legacy snapshot already published at ${fingerprint} (${objects.length} objects).`)
      return { uploaded: false, reason: 'unchanged', ...counts }
    }
    log(
      published === null
        ? `No completed upload recorded — publishing ${objects.length} objects at ${fingerprint}.`
        : `Snapshot changed (${published} → ${fingerprint}) — republishing ${objects.length} objects.`,
    )
  }

  // Sequential on purpose. Concurrency would win maybe a minute on a
  // 282-object run, at the cost of the two things this loop is for:
  // documents strictly before icons, and a log whose last line is the
  // last object that actually landed.
  let done = 0
  for (const object of objects) {
    await store.put(object.key, object.bytes, object.contentType)
    done += 1
    log(`  [${done}/${objects.length}] ${object.key} (${object.bytes.byteLength} B)`)
  }

  // LAST, and only now: every put above resolved. Writing this earlier
  // — or concurrently — would let an interrupted run mark itself
  // complete and make the *next* deploy a no-op, so the gap would never
  // heal on its own.
  const sidecar = {
    fingerprint,
    objects: objects.length,
    documents: documentCount,
    icons: iconCount,
    uploaded_at: new Date().toISOString(),
  }
  await store.put(
    LEGACY_FINGERPRINT_KEY,
    Buffer.from(`${JSON.stringify(sidecar, null, 2)}\n`, 'utf8'),
    contentTypeFor(LEGACY_FINGERPRINT_KEY),
  )
  log(
    `Published ${documentCount} document(s) + ${iconCount} icon object(s); ` +
      `${LEGACY_FINGERPRINT_KEY} = ${fingerprint}`,
  )

  return { uploaded: true, reason: 'published', ...counts }
}

/** R2 through the S3 API. Same client setup as `r2-upload.ts`. */
export function s3Store(client: S3Client, bucket: string): LegacyObjectStore {
  return {
    async getText(key: string): Promise<string | null> {
      try {
        const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
        return await res.Body!.transformToString()
      } catch (e) {
        if (e instanceof NoSuchKey) return null
        if ((e as { name?: string }).name === 'NoSuchKey') return null
        throw e
      }
    },
    async put(key: string, body: Buffer, contentType: string): Promise<void> {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      )
    },
  }
}

interface ParsedArgs {
  legacyRoot: string
  force: boolean
}

function parseArgs(argv: string[]): ParsedArgs {
  let legacyRoot = DEFAULT_LEGACY_ROOT
  let force = false
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--legacy') {
      legacyRoot = resolve(argv[++i] ?? '')
    } else if (arg === '--force') {
      force = true
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return { legacyRoot, force }
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const { legacyRoot, force } = parseArgs(argv)

  const accountId = requireEnv('R2_ACCOUNT_ID')
  const bucket = requireEnv('R2_BUCKET')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  })

  const result = await uploadLegacySnapshot({
    legacyRoot,
    force,
    store: s3Store(client, bucket),
    log: (line) => console.log(line),
  })
  console.log(
    `r2-upload-legacy: ${result.reason} (${result.objectCount} objects → s3://${bucket}/legacy/)`,
  )
}

const isCli = import.meta.url === `file://${process.argv[1]}`
if (isCli) {
  main().catch((e) => {
    console.error(`r2-upload-legacy failed: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  })
}
