import type { Element, InstanceElement } from '@dtpr/api/schema'
import { extract } from './locale.js'
import { interpolate } from './interpolate.js'
import { HEXAGON_FALLBACK_DATA_URI } from './icons.js'
import type { ElementDisplay, ElementDisplayVariable, VariableType } from './types.js'

/**
 * Options for `deriveElementDisplay`.
 *
 *  - `fallbackLocale` overrides the default `'en'` fallback chain used
 *    when the requested locale has no entry.
 *  - `iconUrl` supplies the composed-icon URL (resolved externally — see
 *    the `/elements/:id/icon.svg` REST route or MCP `get_icon_url` tool).
 *    The element schema no longer carries an icon field; consumers that
 *    do not supply one get `HEXAGON_FALLBACK_DATA_URI` so tiles always
 *    render something.
 *  - `iconAlt` overrides the default alt text. Defaults to the resolved
 *    element title, which screen readers already hear adjacent to the
 *    icon in both `<DtprElement>` and `<DtprElementDetail>`.
 */
export interface DeriveElementDisplayOptions {
  fallbackLocale?: string
  iconUrl?: string
  iconAlt?: string
}

/**
 * Merge an element definition with an optional datachain-instance
 * placement and a locale, yielding display-ready strings + variables
 * for the presentation layer. All localized fields (title, description,
 * citation) are resolved via `extract`. Icons are resolved externally
 * — callers pass `options.iconUrl` (e.g. the URL returned by the REST
 * `/elements/:id/icon.svg` route) and fall back to
 * `HEXAGON_FALLBACK_DATA_URI` when none is supplied.
 *
 * `variables` merges the element's declared variables with the values
 * supplied by `instance`. Each entry preserves `required` from the
 * declaration; `value` is `''` when the instance does not provide one
 * (or when no instance is passed). `type` is drawn from the variable
 * declaration if present, defaulting to `'text'` — the current
 * `Variable` schema does not yet carry a `type` field, so this default
 * is the only code path exercised today.
 */
export function deriveElementDisplay(
  element: Element,
  instance: InstanceElement | undefined,
  locale: string,
  options: DeriveElementDisplayOptions = {},
): ElementDisplay {
  const fallbackLocale = options.fallbackLocale ?? 'en'

  const title = extract(element.title, locale, fallbackLocale)
  const citation = extract(element.citation, locale, fallbackLocale)
  const rawDescription = extract(element.description, locale, fallbackLocale)
  const iconUrl =
    options.iconUrl && options.iconUrl.length > 0
      ? options.iconUrl
      : HEXAGON_FALLBACK_DATA_URI
  const iconAlt = options.iconAlt ?? title

  const instanceVarValues = new Map<string, string>()
  const instanceVariables = instance?.variables ?? []
  for (const v of instanceVariables) {
    instanceVarValues.set(v.id, v.value)
  }

  const variables: ElementDisplayVariable[] = (element.variables ?? []).map((decl) => {
    // `Variable` does not currently carry a `type` field on the schema;
    // default to 'text'. When the schema adds one, this is the place to
    // read it (declaration is source of truth).
    const declaredType = (decl as { type?: VariableType }).type
    return {
      id: decl.id,
      label: extract(decl.label, locale, fallbackLocale),
      value: instanceVarValues.get(decl.id) ?? '',
      type: declaredType ?? 'text',
      required: decl.required ?? false,
    }
  })

  const interpolationVars: Record<string, string> = {}
  for (const v of variables) {
    // Only resolve {{var}} when the caller actually supplied a value.
    // Missing values leave the placeholder literal so consumers can
    // warn / highlight / replace as needed (matches `interpolate` semantics).
    if (instanceVarValues.has(v.id)) {
      interpolationVars[v.id] = v.value
    }
  }
  const description = interpolate(rawDescription, interpolationVars)

  return {
    title,
    description,
    icon: { url: iconUrl, alt: iconAlt },
    variables,
    citation,
  }
}
