/**
 * Inline-bundle fallback (R10b).
 *
 * P1 ships R2-only — `schema:build` does not currently emit an
 * `inline.ts` module, so this registry is empty. The hook exists so
 * the loader composition in `composed-loader.ts` can short-circuit to
 * inline data without a code change once the build step starts
 * emitting it. Adding an inline bundle is then a one-line registration:
 *
 *   import inline_ai_2026_04_16 from '../../dist/schemas/ai/2026-04-16/inline.ts'
 *   register('ai@2026-04-16', inline_ai_2026_04_16)
 *
 * Until then, `getInlineBundle` always returns `null` and routes fall
 * through to R2.
 */

import type { Category } from '../schema/category.ts'
import type { DatachainType } from '../schema/datachain-type.ts'
import type { Element } from '../schema/element.ts'
import type { LocaleCode } from '../schema/locale.ts'
import type { SchemaManifest } from '../schema/manifest.ts'

export interface InlineBundle {
  manifest: SchemaManifest
  datachainType: DatachainType
  categories: Category[]
  elements: Element[]
  schemaJson: Record<string, unknown>
  /** Serialized MiniSearch index per locale (raw JSON strings). */
  searchIndexesByLocale: Partial<Record<LocaleCode, string>>
  /** Symbol SVGs keyed by `symbol_id`. */
  symbols: Record<string, string>
  /** Composed icon SVGs keyed by `<element_id>/<variant>`. */
  composedIcons: Record<string, string>
}

const REGISTRY = new Map<string, InlineBundle>()

/** Register an inline bundle keyed by canonical version string. */
export function registerInlineBundle(canonicalVersion: string, bundle: InlineBundle): void {
  REGISTRY.set(canonicalVersion, bundle)
}

/** Retrieve a registered inline bundle, or `null` if none. */
export function getInlineBundle(canonicalVersion: string): InlineBundle | null {
  return REGISTRY.get(canonicalVersion) ?? null
}

/** Test-only: clear all registered inline bundles. */
export function _resetInlineBundles(): void {
  REGISTRY.clear()
}
