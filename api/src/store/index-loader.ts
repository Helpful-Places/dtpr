import { cached } from './cache-wrapper.ts'
import { INDEX_KEY } from './keys.ts'
import { R2LoadError, type LoadContext } from './r2-loader.ts'

/**
 * One entry in `schemas/index.json`. Mirrors the shape produced by
 * `api/scripts/r2-upload.ts`. Kept structural here (rather than a Zod
 * schema) because the index is server-authored and read-only — clients
 * receive a re-shaped envelope.
 */
export interface SchemaIndexEntry {
  id: string
  status: 'beta' | 'stable'
  created_at: string
  content_hash: string
}

export interface SchemaIndex {
  versions: SchemaIndexEntry[]
}

/**
 * Index TTL is short (60 s) because promotions rewrite this single
 * object and we want the new version visible across the edge fleet
 * within a minute. Per-version manifest reads still cache for 24 h.
 */
const INDEX_TTL_SECONDS = 60

/**
 * Load `schemas/index.json`. Missing index treated as an empty
 * `{ versions: [] }` so a freshly-provisioned bucket doesn't 500.
 */
export async function loadSchemaIndex(ctx: LoadContext): Promise<SchemaIndex> {
  const result = await cached<SchemaIndex>(
    INDEX_KEY,
    async () => {
      let obj: R2ObjectBody | null
      try {
        obj = await ctx.bucket.get(INDEX_KEY)
      } catch (e) {
        throw new R2LoadError(
          `R2 read failed for ${INDEX_KEY}: ${(e as Error).message}`,
          INDEX_KEY,
          e,
        )
      }
      if (!obj) return null
      try {
        return (await obj.json()) as SchemaIndex
      } catch (e) {
        throw new R2LoadError(
          `R2 object ${INDEX_KEY} is not valid JSON: ${(e as Error).message}`,
          INDEX_KEY,
          e,
        )
      }
    },
    { enabled: true, ttl: INDEX_TTL_SECONDS, ctx: ctx.ctx },
  )
  return result ?? { versions: [] }
}
