/**
 * CI helper: prune `schemas/index.json` so it matches the source tree.
 *
 * `r2-upload.ts` only ever adds or updates index entries — it never
 * removes them. After `schema:promote` renames a beta directory to its
 * stable form (or any version is deleted from `api/schemas/`), the old
 * entry would otherwise linger in R2's index forever, kept reachable
 * by the worker (`api/src/rest/version-resolver.ts:55` gates every
 * read through this index).
 *
 * This script:
 *   1. Walks `api/schemas/<type>/*\/` to compute the expected version set.
 *   2. Reads `schemas/index.json` from R2.
 *   3. Drops any index entry whose `id` isn't in the expected set.
 *   4. Rewrites the index (no-op if nothing changed).
 *
 * Underlying R2 objects for the dropped versions are NOT deleted —
 * removing the index entry already makes them unreachable through the
 * worker. Object GC can be a follow-up if storage cost matters.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *
 * Usage:
 *   tsx scripts/r2-prune.ts
 */

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

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

async function listExpectedVersions(schemasRoot: string): Promise<Set<string>> {
  const expected = new Set<string>()
  const types = await readdir(schemasRoot, { withFileTypes: true })
  for (const type of types) {
    if (!type.isDirectory()) continue
    const versionDirs = await readdir(join(schemasRoot, type.name), {
      withFileTypes: true,
    })
    for (const v of versionDirs) {
      if (!v.isDirectory()) continue
      expected.add(`${type.name}@${v.name}`)
    }
  }
  return expected
}

async function getIndex(client: S3Client, bucket: string): Promise<IndexFile | null> {
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: 'schemas/index.json' }),
    )
    const text = await res.Body!.transformToString()
    return JSON.parse(text) as IndexFile
  } catch (e) {
    if (e instanceof NoSuchKey) return null
    if ((e as { name?: string }).name === 'NoSuchKey') return null
    throw e
  }
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export async function main(): Promise<void> {
  const expected = await listExpectedVersions(join(API_ROOT, 'schemas'))
  if (expected.size === 0) {
    throw new Error(
      `No schema versions found under api/schemas/. Refusing to prune — this would empty the live index.`,
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

  const index = await getIndex(client, bucket)
  if (!index) {
    console.log('r2-prune: no schemas/index.json in R2 — nothing to prune.')
    return
  }

  const kept = index.versions.filter((entry) => expected.has(entry.id))
  const dropped = index.versions.filter((entry) => !expected.has(entry.id))

  if (dropped.length === 0) {
    console.log(`r2-prune: index already matches source tree (${kept.length} version(s)).`)
    return
  }

  for (const entry of dropped) {
    console.log(`  drop ${entry.id} (${entry.status}, ${entry.content_hash})`)
  }

  const next: IndexFile = {
    versions: kept.slice().sort((a, b) => a.id.localeCompare(b.id)),
  }
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: 'schemas/index.json',
      Body: Buffer.from(JSON.stringify(next, null, 2), 'utf8'),
      ContentType: 'application/json',
    }),
  )
  console.log(
    `r2-prune: removed ${dropped.length} version(s); index now lists ${next.versions.length}.`,
  )
}

const isCli = import.meta.url === `file://${process.argv[1]}`
if (isCli) {
  main().catch((e) => {
    console.error(`r2-prune failed: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  })
}
