/**
 * Deterministic JSON serialization with sorted object keys at every
 * boundary. Arrays are preserved in input order — array ordering is the
 * caller's responsibility (see `resolve.ts` for the locale and id
 * orderings the resolver applies before stringification).
 *
 * Always operates on post-Zod-parsed values: Zod default population
 * (e.g. `priority: 0`, `variables: []`) is the canonicalization input,
 * so two thin instances differing only in elided defaults produce
 * byte-identical output.
 *
 * Output matches `JSON.stringify` semantics for primitives and ignores
 * `undefined` properties (matching `JSON.stringify`'s drop behavior).
 * `null` is preserved.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'number') {
    // JSON.stringify handles NaN/Infinity by emitting `null`; reuse it.
    return JSON.stringify(value)
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    const parts = value.map((v) => (v === undefined ? 'null' : canonicalStringify(v)))
    return `[${parts.join(',')}]`
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    const parts: string[] = []
    for (const k of keys) {
      const v = obj[k]
      if (v === undefined) continue
      parts.push(`${JSON.stringify(k)}:${canonicalStringify(v)}`)
    }
    return `{${parts.join(',')}}`
  }
  // undefined / functions / symbols at the top level → match JSON.stringify which returns undefined.
  // Caller should never pass these; coerce to JSON null for resilience.
  return 'null'
}
