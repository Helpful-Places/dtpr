import { createHash } from 'node:crypto'

/**
 * Stable canonical JSON stringify — sorts object keys at every level
 * so that whitespace and key-order differences in source YAML do not
 * change the emitted content hash. Primitive arrays retain their order.
 */
export function canonicalStringify(value: unknown): string {
  // Track ancestors (not all-seen) so shared-but-acyclic references don't
  // falsely trip the cycle detector — we remove each node on the way back
  // up the stack.
  const ancestors = new WeakSet<object>()
  const walk = (v: unknown): unknown => {
    if (v === null) return null
    if (typeof v !== 'object') return v
    if (ancestors.has(v as object)) {
      throw new Error('Circular reference in canonicalStringify input')
    }
    ancestors.add(v as object)
    try {
      if (Array.isArray(v)) return v.map(walk)
      const entries = Object.entries(v as Record<string, unknown>)
        .filter(([, val]) => val !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, val]) => [k, walk(val)] as const)
      return Object.fromEntries(entries)
    } finally {
      ancestors.delete(v as object)
    }
  }
  return JSON.stringify(walk(value))
}

/**
 * sha256 of the canonical JSON of `value`. Returns `sha256-<hex>` — the
 * form served in the `DTPR-Content-Hash` response header and embedded
 * in every manifest.
 */
export function contentHash(value: unknown): string {
  const canonical = canonicalStringify(value)
  const digest = createHash('sha256').update(canonical).digest('hex')
  return `sha256-${digest}`
}
