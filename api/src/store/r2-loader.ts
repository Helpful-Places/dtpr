import type { Category } from '../schema/category.ts'
import type { DatachainType } from '../schema/datachain-type.ts'
import type { Element } from '../schema/element.ts'
import type { LocaleCode } from '../schema/locale.ts'
import type { SchemaManifest } from '../schema/manifest.ts'
import type { ParsedVersion } from '../../cli/lib/version-parser.ts'
import { cached, cachedText, type CacheOptions } from './cache-wrapper.ts'
import {
  categoriesKey,
  datachainTypeKey,
  elementKey,
  elementsKey,
  manifestKey,
  schemaJsonKey,
  searchIndexKey,
} from './keys.ts'

/** Default per-version cache TTL for stable versions. 24 hours. */
const STABLE_TTL_SECONDS = 86_400

/**
 * Thrown when an R2 read fails for a non-404 reason. Routes map this
 * to a 502 envelope (upstream failure) so clients can distinguish
 * "not found" from "the store is unhealthy".
 */
export class R2LoadError extends Error {
  constructor(
    message: string,
    public readonly key: string,
    public override readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'R2LoadError'
  }
}

/**
 * Subset of `ExecutionContext` that the cache wrapper actually uses.
 * Declared structurally so callers can pass the value Hono exposes on
 * its Context (`c.executionCtx`) without a type cast — Hono's type and
 * the Cloudflare-generated type differ on optional fields.
 */
export interface ExecutionLike {
  waitUntil(promise: Promise<unknown>): void
}

/**
 * Per-call context for the loaders. Bundling the bucket + execution
 * context here means routes pass one object instead of three positional
 * arguments to every loader call.
 */
export interface LoadContext {
  bucket: R2Bucket
  ctx?: ExecutionLike
}

function cacheOptionsFor(version: ParsedVersion, ctx?: ExecutionLike): CacheOptions {
  // Beta versions are never cached — content is mutable and we want
  // consumers to see fresh bytes on every fetch. Stable versions are
  // immutable, so cache for the full TTL.
  return { enabled: !version.beta, ttl: STABLE_TTL_SECONDS, ctx }
}

async function getJson<T>(bucket: R2Bucket, key: string): Promise<T | null> {
  let obj: R2ObjectBody | null
  try {
    obj = await bucket.get(key)
  } catch (e) {
    throw new R2LoadError(`R2 read failed for ${key}: ${(e as Error).message}`, key, e)
  }
  if (!obj) return null
  try {
    return (await obj.json()) as T
  } catch (e) {
    throw new R2LoadError(`R2 object ${key} is not valid JSON: ${(e as Error).message}`, key, e)
  }
}

async function getText(bucket: R2Bucket, key: string): Promise<string | null> {
  let obj: R2ObjectBody | null
  try {
    obj = await bucket.get(key)
  } catch (e) {
    throw new R2LoadError(`R2 read failed for ${key}: ${(e as Error).message}`, key, e)
  }
  if (!obj) return null
  return obj.text()
}

/** Load the version manifest. Returns `null` if the version is unknown. */
export function loadManifest(
  ctx: LoadContext,
  version: ParsedVersion,
): Promise<SchemaManifest | null> {
  const key = manifestKey(version)
  return cached(key, () => getJson<SchemaManifest>(ctx.bucket, key), cacheOptionsFor(version, ctx.ctx))
}

/** Load the datachain-type definition. */
export function loadDatachainType(
  ctx: LoadContext,
  version: ParsedVersion,
): Promise<DatachainType | null> {
  const key = datachainTypeKey(version)
  return cached(
    key,
    () => getJson<DatachainType>(ctx.bucket, key),
    cacheOptionsFor(version, ctx.ctx),
  )
}

/** Load all categories for a version (already ordered by the build step). */
export function loadCategories(
  ctx: LoadContext,
  version: ParsedVersion,
): Promise<Category[] | null> {
  const key = categoriesKey(version)
  return cached(key, () => getJson<Category[]>(ctx.bucket, key), cacheOptionsFor(version, ctx.ctx))
}

/** Load the full elements list (variables already materialized). */
export function loadElements(
  ctx: LoadContext,
  version: ParsedVersion,
): Promise<Element[] | null> {
  const key = elementsKey(version)
  return cached(key, () => getJson<Element[]>(ctx.bucket, key), cacheOptionsFor(version, ctx.ctx))
}

/** Point read for a single element by id. Optimized via per-element JSON. */
export function loadElement(
  ctx: LoadContext,
  version: ParsedVersion,
  elementId: string,
): Promise<Element | null> {
  const key = elementKey(version, elementId)
  return cached(key, () => getJson<Element>(ctx.bucket, key), cacheOptionsFor(version, ctx.ctx))
}

/**
 * Load the serialized MiniSearch index for a locale. Returned as the
 * raw JSON string so callers can pass it straight to
 * `MiniSearch.loadJSON` without a round-trip through the JS parser.
 */
export function loadSearchIndex(
  ctx: LoadContext,
  version: ParsedVersion,
  locale: LocaleCode,
): Promise<string | null> {
  const key = searchIndexKey(version, locale)
  return cachedText(key, () => getText(ctx.bucket, key), cacheOptionsFor(version, ctx.ctx))
}

/**
 * Load the per-version JSON Schema bundle (used by tools/list output
 * and by clients wanting to validate datachain payloads themselves).
 */
export function loadSchemaJson(
  ctx: LoadContext,
  version: ParsedVersion,
): Promise<Record<string, unknown> | null> {
  const key = schemaJsonKey(version)
  return cached(
    key,
    () => getJson<Record<string, unknown>>(ctx.bucket, key),
    cacheOptionsFor(version, ctx.ctx),
  )
}
