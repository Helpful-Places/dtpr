/**
 * CI helper: upload a built schema bundle to R2 atomically.
 *
 * Atomicity contract (per Unit 6 of the plan):
 *   1. All version assets are uploaded under `schemas/<type>/<version>/...`.
 *   2. The top-level `schemas/index.json` is rewritten LAST. The Worker
 *      enumerates versions through that index, so partially-uploaded
 *      bundles are unreachable to clients until the index flip commits.
 *
 * Idempotency + immutability:
 *   - If an existing manifest in R2 has the same `content_hash` as the
 *     local bundle, the upload short-circuits.
 *   - If hashes differ and the version is `stable`, the script fails
 *     (immutability breach — promotion creates a new version, never
 *     overwrites a stable one).
 *
 * Required env vars:
 *   R2_ACCOUNT_ID            Cloudflare account UUID
 *   R2_ACCESS_KEY_ID         R2 S3 access key (Object Read & Write scope)
 *   R2_SECRET_ACCESS_KEY     paired secret
 *   R2_BUCKET                target bucket (e.g. `dtpr-api`, `dtpr-api-preview`)
 *
 * Usage:
 *   tsx scripts/r2-upload.ts <version> [--dist <path>]
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { parseVersion, type ParsedVersion } from '../cli/lib/version-parser.ts'

const API_ROOT = fileURLToPath(new URL('..', import.meta.url))

interface IndexEntry {
  id: string
  status: 'beta' | 'stable'
  created_at: string
  content_hash: string
}

interface IndexFile {
  versions: IndexEntry[]
}

interface ManifestFile {
  version: string
  status: 'beta' | 'stable'
  created_at: string
  content_hash: string
  notes?: string
  locales: string[]
}

interface UploadOptions {
  version: ParsedVersion
  distRoot: string
  client: S3Client
  bucket: string
  log: (line: string) => void
}

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
}

export function contentTypeFor(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.'))
  return CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream'
}

export { walkFiles }

async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) await walk(abs)
      else if (entry.isFile()) out.push(abs)
    }
  }
  await walk(root)
  return out.sort()
}

async function getJson<T>(client: S3Client, bucket: string, key: string): Promise<T | null> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    const text = await res.Body!.transformToString()
    return JSON.parse(text) as T
  } catch (e) {
    if (e instanceof NoSuchKey) return null
    if ((e as { name?: string }).name === 'NoSuchKey') return null
    throw e
  }
}

async function putFile(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

async function uploadVersion(opts: UploadOptions): Promise<{ uploaded: boolean; reason: string }> {
  const { version, distRoot, client, bucket, log } = opts
  const versionDir = join(distRoot, version.dir)

  const manifestText = await readFile(join(versionDir, 'manifest.json'), 'utf8')
  const localManifest = JSON.parse(manifestText) as ManifestFile

  const remoteManifestKey = `schemas/${version.dir}/manifest.json`
  const existing = await getJson<ManifestFile>(client, bucket, remoteManifestKey)
  if (existing) {
    if (existing.content_hash === localManifest.content_hash) {
      log(`No-op: ${version.canonical} already at ${localManifest.content_hash}`)
      return { uploaded: false, reason: 'unchanged' }
    }
    if (existing.status === 'stable') {
      throw new Error(
        `Stable version ${version.canonical} already exists with a different content_hash. ` +
          `Stable versions are immutable. Use \`schema:promote\` to publish a new version instead.`,
      )
    }
    log(`Beta overwrite: ${version.canonical} (${existing.content_hash} → ${localManifest.content_hash})`)
  } else {
    log(`New version: ${version.canonical} (${localManifest.content_hash})`)
  }

  // 1. Upload every file in the version dir to schemas/<type>/<version>/<rel>.
  const files = await walkFiles(versionDir)
  if (files.length === 0) throw new Error(`No files found under ${versionDir}`)
  for (const abs of files) {
    const rel = relative(versionDir, abs).split(/[\\/]/).join('/')
    const key = `schemas/${version.dir}/${rel}`
    const body = await readFile(abs)
    await putFile(client, bucket, key, body, contentTypeFor(rel))
    log(`  uploaded ${key} (${body.byteLength} B)`)
  }

  // 2. Verify the manifest is readable through R2 before we flip the index.
  const verifyManifest = await getJson<ManifestFile>(client, bucket, remoteManifestKey)
  if (!verifyManifest || verifyManifest.content_hash !== localManifest.content_hash) {
    throw new Error(
      `Post-upload verification failed for ${remoteManifestKey} — refusing to update index.json.`,
    )
  }

  // 3. Last write: update the top-level index.json.
  const index = (await getJson<IndexFile>(client, bucket, 'schemas/index.json')) ?? { versions: [] }
  const entry: IndexEntry = {
    id: localManifest.version,
    status: localManifest.status,
    created_at: localManifest.created_at,
    content_hash: localManifest.content_hash,
  }
  const without = index.versions.filter((v) => v.id !== entry.id)
  const next: IndexFile = {
    versions: [...without, entry].sort((a, b) => a.id.localeCompare(b.id)),
  }
  await putFile(
    client,
    bucket,
    'schemas/index.json',
    Buffer.from(JSON.stringify(next, null, 2), 'utf8'),
    'application/json',
  )
  log(`Index updated: ${next.versions.length} version(s) in schemas/index.json`)

  return { uploaded: true, reason: existing ? 'overwrite' : 'new' }
}

interface ParsedArgs {
  versionArg: string
  distRoot: string
}

function parseArgs(argv: string[]): ParsedArgs {
  let versionArg = ''
  let distRoot = join(API_ROOT, 'dist', 'schemas')
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--dist') {
      distRoot = resolve(argv[++i] ?? '')
    } else if (!arg.startsWith('-')) {
      versionArg = arg
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  if (!versionArg) {
    throw new Error('Usage: r2-upload.ts <version> [--dist <path>]')
  }
  return { versionArg, distRoot }
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const { versionArg, distRoot } = parseArgs(argv)
  const version = parseVersion(versionArg)

  const distVersionDir = join(distRoot, version.dir)
  const distStat = await stat(distVersionDir).catch(() => null)
  if (!distStat?.isDirectory()) {
    throw new Error(
      `Bundle dir not found: ${distVersionDir}. Run \`pnpm --filter ./api schema:build ${version.canonical}\` first.`,
    )
  }

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

  const result = await uploadVersion({
    version,
    distRoot,
    client,
    bucket,
    log: (line) => console.log(line),
  })
  console.log(`r2-upload: ${result.reason} (${version.canonical} → s3://${bucket})`)
}

const isCli = import.meta.url === `file://${process.argv[1]}`
if (isCli) {
  main().catch((e) => {
    console.error(`r2-upload failed: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  })
}
