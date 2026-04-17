import type { InterpolateSegment } from './types.js'

/**
 * Matches `{{name}}` or `{{ name }}` — whitespace around the variable
 * id is tolerated. Variable ids are whitelisted by the schema to
 * `[a-zA-Z0-9_-]+`, so the pattern is deliberately strict.
 */
const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g

/**
 * Substitute `{{name}}` (and `{{ name }}`) with values from `vars`.
 * Unresolved placeholders pass through literally — this matches the
 * origin behavior and means callers can distinguish "missing value"
 * from "empty value" if they need to.
 */
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(PLACEHOLDER_RE, (match, id) => {
    if (Object.prototype.hasOwnProperty.call(vars, id)) {
      return vars[id] ?? match
    }
    return match
  })
}

/**
 * Split a template into an ordered array of text, variable, and
 * missing-variable segments. A missing segment carries the original
 * placeholder (`{{name}}`) as its `value` so callers can re-emit the
 * literal token (or substitute a warning UI) while keeping every
 * run of characters accounted for exactly once.
 */
export function interpolateSegments(
  template: string,
  vars: Record<string, string>,
): InterpolateSegment[] {
  const segments: InterpolateSegment[] = []
  if (template === '') return segments

  let lastIndex = 0
  // Reset state in case the regex object is shared across calls (it's /g).
  PLACEHOLDER_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = PLACEHOLDER_RE.exec(template)) !== null) {
    const [placeholder, id] = match
    const start = match.index
    if (start > lastIndex) {
      segments.push({ kind: 'text', value: template.slice(lastIndex, start) })
    }
    if (id !== undefined && Object.prototype.hasOwnProperty.call(vars, id)) {
      segments.push({ kind: 'variable', variable_id: id, value: vars[id] ?? '' })
    } else if (id !== undefined) {
      segments.push({ kind: 'missing', variable_id: id, value: placeholder })
    }
    lastIndex = start + placeholder.length
  }
  if (lastIndex < template.length) {
    segments.push({ kind: 'text', value: template.slice(lastIndex) })
  }
  return segments
}
