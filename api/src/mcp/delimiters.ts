/**
 * Provenance tagging for element prose surfaced to LLMs.
 *
 * When an element's `description` or `citation` is rendered into the
 * `text` content block of a tool response, wrap it in
 * `<dtpr_element>` tags so the receiving LLM treats the content as
 * data rather than instructions. The structured-content block is left
 * untouched (it's data already).
 *
 * The wrapper attributes are sanitized — element ids and locale codes
 * are already constrained at the schema layer to safe character sets.
 */

import type { Element } from '../schema/element.ts'
import type { LocaleCode } from '../schema/locale.ts'

const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/

function safeAttr(value: string): string {
  // Defense in depth: drop any character that could break out of the
  // attribute even though `id` and `locale` are already restricted.
  return value.replace(/[^a-zA-Z0-9_.-]/g, '')
}

export interface WrapElementOptions {
  /** Schema version that produced the element (for traceability). */
  version: string
  /** Locale of the prose being wrapped. */
  locale: LocaleCode
}

/**
 * Wrap a single localized string in a provenance tag.
 */
export function wrapText(value: string, opts: { id: string; version: string; locale: LocaleCode }): string {
  const id = SAFE_ID_RE.test(opts.id) ? opts.id : safeAttr(opts.id)
  const version = safeAttr(opts.version)
  const locale = safeAttr(opts.locale)
  return `<dtpr_element id="${id}" locale="${locale}" version="${version}">${value}</dtpr_element>`
}

/**
 * Build a single concatenated prose blob for an element across all
 * locales it carries. Used when including the element's content as
 * free-form text in a tool response (e.g., the agent rendering
 * `get_element` for a user).
 */
export function wrapElementContent(element: Element, opts: WrapElementOptions): string {
  const parts: string[] = []
  for (const t of element.title) {
    parts.push(wrapText(t.value, { id: element.id, version: opts.version, locale: t.locale as LocaleCode }))
  }
  for (const d of element.description) {
    parts.push(wrapText(d.value, { id: element.id, version: opts.version, locale: d.locale as LocaleCode }))
  }
  for (const c of element.citation) {
    parts.push(wrapText(c.value, { id: element.id, version: opts.version, locale: c.locale as LocaleCode }))
  }
  return parts.join('\n')
}
