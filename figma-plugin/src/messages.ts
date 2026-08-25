/**
 * The typed postMessage protocol between the UI iframe and the plugin
 * sandbox.
 *
 * The split is forced by Figma: `fetch` lives in the iframe (a real
 * browser context, declared in `manifest.json` under `networkAccess`),
 * while node creation lives in the sandbox. So the UI does all the
 * network work and streams results across; the sandbox only builds.
 *
 * Element metadata travels once, in `build-start`. Icons stream after
 * it carrying nothing but their id, token, and SVG — a full build is
 * ~470 icons and roughly a megabyte of SVG, so the per-icon payload is
 * kept as small as it can be. `build-start` also fixes the element
 * order, which matters because icon fetches complete out of order.
 */

import type { Category } from './api.ts'

/** Everything the sandbox needs about one element, sent once. */
export interface ElementMeta {
  id: string
  categoryId: string
  title: string
  description: string
  /** Variant tokens being fetched for this element, in API order. */
  variantTokens: string[]
}

/** One fetched icon. */
export interface IconPayload {
  elementId: string
  /** Raw variant token as the API spells it (`default`, `vendor.dark`, …). */
  variantToken: string
  svg: string
}

export interface GenerateSettings {
  version: string
  locale: string
  /** Skip every non-`default` context variant — a much faster build. */
  defaultContextOnly: boolean
  /** Skip dark-theme icons. */
  lightThemeOnly: boolean
  /** Draw an element-title caption under each icon. */
  includeLabels: boolean
}

/** Messages the UI iframe sends to the sandbox. */
export type UiToCode =
  | { type: 'ui-ready' }
  | { type: 'save-settings'; settings: GenerateSettings }
  | {
      type: 'build-start'
      settings: GenerateSettings
      contentHash: string
      categories: Category[]
      elements: ElementMeta[]
    }
  | { type: 'build-batch'; icons: IconPayload[] }
  | { type: 'build-end' }
  | { type: 'build-abort'; message: string }
  | { type: 'close' }

/** Messages the sandbox sends to the UI iframe. */
export type CodeToUi =
  | { type: 'code-ready'; settings: GenerateSettings | null }
  | { type: 'build-progress'; done: number; total: number; label: string }
  | { type: 'build-done'; components: number; sets: number; pageName: string }
  | { type: 'build-failed'; message: string }
