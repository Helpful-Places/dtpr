import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { err } from '../types.ts'

/**
 * Symbol-ref / symbol-safety rules.
 *
 * 1. Each element's `symbol_id` must resolve to a loaded symbol. Emits
 *    `SYMBOL_NOT_FOUND` with a `fix_hint` listing the 3 nearest symbol
 *    ids (common-prefix + Levenshtein).
 * 2. Each loaded symbol must be a well-formed `<svg ...>...</svg>`
 *    document. Emits `SYMBOL_MALFORMED_WRAPPER` when the source begins
 *    with a BOM, XML prolog, or leading comment — load-bearing for the
 *    compositor's `stripOuterSvg` regex.
 * 3. Each loaded symbol is scanned for active content (script tags,
 *    event-handler attributes, non-`data:` hrefs, `<foreignObject>`,
 *    cross-document `<use>` refs). Emits `SYMBOL_ACTIVE_CONTENT`.
 *    Composed SVGs may be loaded via `<object>`/`<embed>` where active
 *    content executes; this guard prevents a symbol author from
 *    introducing XSS surface.
 */
export function checkSymbolRefs(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []
  const knownIds = Object.keys(source.symbols).sort()

  // 1. Element symbol_id must resolve.
  for (const [ei, el] of source.elements.entries()) {
    if (!Object.prototype.hasOwnProperty.call(source.symbols, el.symbol_id)) {
      const suggestions = nearestIds(el.symbol_id, knownIds, 3)
      const hint =
        suggestions.length > 0
          ? `Did you mean: ${suggestions.join(', ')}? Or add ${el.symbol_id}.svg to <release>/symbols/.`
          : `Add a ${el.symbol_id}.svg file under <release>/symbols/.`
      findings.push(
        err(
          'SYMBOL_NOT_FOUND',
          `Element '${el.id}' references unknown symbol '${el.symbol_id}'`,
          {
            path: `elements[${ei}].symbol_id`,
            fix_hint: hint,
          },
        ),
      )
    }
  }

  // 2 + 3. Per-symbol scans.
  for (const id of knownIds) {
    const bytes = source.symbols[id]!
    const wrapperErr = checkWrapper(id, bytes)
    if (wrapperErr) findings.push(wrapperErr)
    findings.push(...checkActiveContent(id, bytes))
  }

  return findings
}

/**
 * A symbol file is only safe to feed to `stripOuterSvg` if it starts
 * with the `<svg ...>` open tag — no BOM, no XML prolog, no leading
 * comment. Leading ASCII whitespace is tolerated (matches the
 * compositor's regex).
 */
function checkWrapper(id: string, bytes: string): SemanticError | null {
  if (bytes.charCodeAt(0) === 0xfeff) {
    return err(
      'SYMBOL_MALFORMED_WRAPPER',
      `Symbol '${id}' begins with a UTF-8 BOM`,
      {
        path: `symbols.${id}`,
        fix_hint: `Remove the BOM from symbols/${id}.svg. The compositor expects the file to start with '<svg ...>'.`,
      },
    )
  }
  // Skip leading ASCII whitespace only (matches compositor behavior —
  // does NOT strip U+FEFF or NBSP because the compositor won't either).
  let i = 0
  while (i < bytes.length) {
    const c = bytes.charCodeAt(i)
    if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) i++
    else break
  }
  const head = bytes.slice(i, i + 5)
  if (head.startsWith('<?xml')) {
    return err(
      'SYMBOL_MALFORMED_WRAPPER',
      `Symbol '${id}' begins with an XML prolog ('<?xml ...?>')`,
      {
        path: `symbols.${id}`,
        fix_hint: `Remove the <?xml ...?> declaration from symbols/${id}.svg — the compositor requires the file to start with '<svg ...>'.`,
      },
    )
  }
  if (head.startsWith('<!--')) {
    return err(
      'SYMBOL_MALFORMED_WRAPPER',
      `Symbol '${id}' begins with an XML comment`,
      {
        path: `symbols.${id}`,
        fix_hint: `Remove the leading '<!-- ... -->' from symbols/${id}.svg — the compositor requires the file to start with '<svg ...>'.`,
      },
    )
  }
  return null
}

const SCRIPT_TAG_RE = /<script[\s>]/i
const EVENT_HANDLER_RE = /\son[a-z]+\s*=/i
const FOREIGN_OBJECT_RE = /<foreignObject\b/i
// Capture the attribute value inside quotes. Match both href and
// xlink:href, with either single or double quotes.
const HREF_RE = /\b(?:xlink:href|href)\s*=\s*(['"])([^'"]*)\1/gi
// Match a <use ...> tag with its attribute list so we can scan its
// href value specifically (outside-document refs only). Multiline so
// attributes across lines still match.
const USE_TAG_RE = /<use\b([^>]*)>/gi

function checkActiveContent(id: string, bytes: string): SemanticError[] {
  const findings: SemanticError[] = []
  const emit = (message: string) => {
    findings.push(
      err('SYMBOL_ACTIVE_CONTENT', `Symbol '${id}': ${message}`, {
        path: `symbols.${id}`,
        fix_hint: `Remove the offending markup from symbols/${id}.svg. Symbols must contain only static SVG shapes.`,
      }),
    )
  }

  if (SCRIPT_TAG_RE.test(bytes)) {
    emit('contains a <script> tag')
  }
  if (EVENT_HANDLER_RE.test(bytes)) {
    emit('contains an event-handler attribute (on*=)')
  }
  if (FOREIGN_OBJECT_RE.test(bytes)) {
    emit('contains a <foreignObject> element')
  }

  // Scan every href attribute. Allow `data:` URIs and in-document
  // fragment refs (`#id`); reject any other scheme or external ref.
  for (const match of bytes.matchAll(HREF_RE)) {
    const value = match[2] ?? ''
    if (value === '') continue
    if (value.startsWith('#')) continue
    if (value.startsWith('data:')) continue
    emit(
      `contains a non-data-URI href attribute (value '${truncate(value, 80)}')`,
    )
  }

  // Extra defense: <use href="..."> / <use xlink:href="...">
  // pointing at another document (anything that isn't `#fragment`).
  for (const match of bytes.matchAll(USE_TAG_RE)) {
    const attrs = match[1] ?? ''
    const useHref = /\b(?:xlink:href|href)\s*=\s*(['"])([^'"]*)\1/i.exec(attrs)
    if (!useHref) continue
    const value = useHref[2] ?? ''
    if (value.startsWith('#')) continue
    // data: use refs are also a safety smell here — disallow.
    if (value === '') continue
    emit(
      `contains a <use> element referencing an external document (href '${truncate(value, 80)}')`,
    )
  }

  return findings
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}

/**
 * Return the `n` closest ids from `candidates` to `target` by a cheap
 * metric: common-prefix length (preferred) then Levenshtein distance.
 * Deliberately simple — good enough for a fix_hint.
 */
export function nearestIds(target: string, candidates: string[], n: number): string[] {
  type Scored = { id: string; prefix: number; distance: number }
  const scored: Scored[] = candidates.map((id) => ({
    id,
    prefix: commonPrefixLength(target, id),
    distance: levenshtein(target, id),
  }))
  scored.sort((a, b) => {
    if (a.prefix !== b.prefix) return b.prefix - a.prefix
    if (a.distance !== b.distance) return a.distance - b.distance
    return a.id.localeCompare(b.id)
  })
  return scored.slice(0, n).map((s) => s.id)
}

function commonPrefixLength(a: string, b: string): number {
  const len = Math.min(a.length, b.length)
  let i = 0
  while (i < len && a.charCodeAt(i) === b.charCodeAt(i)) i++
  return i
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let prev = new Array<number>(b.length + 1)
  let curr = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1]! + 1,
        prev[j]! + 1,
        prev[j - 1]! + cost,
      )
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]!
}
