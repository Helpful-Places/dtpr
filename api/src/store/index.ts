/**
 * Store module: composes inline-bundle fallback (R10b) on top of the
 * R2 loader. Routes import from this barrel so they don't need to
 * re-implement the routing rule.
 */

import type { Category } from '../schema/category.ts'
import type { DatachainType } from '../schema/datachain-type.ts'
import type { Element } from '../schema/element.ts'
import type { LocaleCode } from '../schema/locale.ts'
import type { SchemaManifest } from '../schema/manifest.ts'
import type { ParsedVersion } from '../../cli/lib/version-parser.ts'
import { getInlineBundle } from './inline-bundles.ts'
import * as r2 from './r2-loader.ts'

export type { LoadContext } from './r2-loader.ts'
export { R2LoadError } from './r2-loader.ts'
export { loadSchemaIndex, type SchemaIndex, type SchemaIndexEntry } from './index-loader.ts'
export {
  registerInlineBundle,
  getInlineBundle,
  _resetInlineBundles,
  type InlineBundle,
} from './inline-bundles.ts'

export async function loadManifest(
  ctx: r2.LoadContext,
  version: ParsedVersion,
): Promise<SchemaManifest | null> {
  const inline = getInlineBundle(version.canonical)
  if (inline) return inline.manifest
  return r2.loadManifest(ctx, version)
}

export async function loadDatachainType(
  ctx: r2.LoadContext,
  version: ParsedVersion,
): Promise<DatachainType | null> {
  const inline = getInlineBundle(version.canonical)
  if (inline) return inline.datachainType
  return r2.loadDatachainType(ctx, version)
}

export async function loadCategories(
  ctx: r2.LoadContext,
  version: ParsedVersion,
): Promise<Category[] | null> {
  const inline = getInlineBundle(version.canonical)
  if (inline) return inline.categories
  return r2.loadCategories(ctx, version)
}

export async function loadElements(
  ctx: r2.LoadContext,
  version: ParsedVersion,
): Promise<Element[] | null> {
  const inline = getInlineBundle(version.canonical)
  if (inline) return inline.elements
  return r2.loadElements(ctx, version)
}

export async function loadElement(
  ctx: r2.LoadContext,
  version: ParsedVersion,
  elementId: string,
): Promise<Element | null> {
  const inline = getInlineBundle(version.canonical)
  if (inline) return inline.elements.find((e) => e.id === elementId) ?? null
  return r2.loadElement(ctx, version, elementId)
}

export async function loadSearchIndex(
  ctx: r2.LoadContext,
  version: ParsedVersion,
  locale: LocaleCode,
): Promise<string | null> {
  const inline = getInlineBundle(version.canonical)
  if (inline) return inline.searchIndexesByLocale[locale] ?? null
  return r2.loadSearchIndex(ctx, version, locale)
}

export async function loadSchemaJson(
  ctx: r2.LoadContext,
  version: ParsedVersion,
): Promise<Record<string, unknown> | null> {
  const inline = getInlineBundle(version.canonical)
  if (inline) return inline.schemaJson
  return r2.loadSchemaJson(ctx, version)
}
