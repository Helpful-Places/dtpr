/**
 * Canonical DTPR schema version string: `{type}@{YYYY-MM-DD}[-beta]`.
 * Also accepts the path form `{type}/{YYYY-MM-DD}[-beta]` for convenience.
 *
 * Examples:
 *   ai@2026-04-16            → { type: 'ai', date: '2026-04-16', beta: false, canonical: 'ai@2026-04-16', dir: 'ai/2026-04-16' }
 *   ai@2026-04-16-beta       → { type: 'ai', date: '2026-04-16', beta: true,  canonical: 'ai@2026-04-16-beta', dir: 'ai/2026-04-16-beta' }
 *   ai/2026-04-16-beta       → same as above
 *
 * Rejects: missing date, partial date, unknown suffix (only `-beta` is allowed).
 */

export interface ParsedVersion {
  type: string
  date: string // ISO 8601 date, YYYY-MM-DD
  beta: boolean
  canonical: string // e.g. "ai@2026-04-16-beta"
  dir: string // filesystem-style subdir, e.g. "ai/2026-04-16-beta"
}

const TYPE_RE = /^[a-zA-Z0-9_-]+$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export class InvalidVersionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidVersionError'
  }
}

export function parseVersion(input: string): ParsedVersion {
  if (typeof input !== 'string' || input.length === 0) {
    throw new InvalidVersionError(`Version string required (got: ${JSON.stringify(input)})`)
  }

  // Accept both `@` and `/` as separators; normalize to canonical `@` form.
  const separatorMatch = input.match(/^([^@/]+)[@/](.+)$/)
  if (!separatorMatch) {
    throw new InvalidVersionError(
      `Version string must be '<type>@<date>[-beta]' or '<type>/<date>[-beta]' (got: '${input}')`,
    )
  }

  const type = separatorMatch[1]!
  const rest = separatorMatch[2]!

  if (!TYPE_RE.test(type)) {
    throw new InvalidVersionError(
      `Type '${type}' contains invalid characters. Allowed: [a-zA-Z0-9_-]`,
    )
  }

  // rest is either <date> or <date>-beta. Date is exactly YYYY-MM-DD (10 chars).
  let beta = false
  let date = rest
  if (rest.endsWith('-beta')) {
    beta = true
    date = rest.slice(0, -'-beta'.length)
  }

  const dateMatch = date.match(DATE_RE)
  if (!dateMatch) {
    // Distinguish unknown suffix from missing date for a clearer error.
    if (rest.includes('-') && !rest.endsWith('-beta')) {
      throw new InvalidVersionError(
        `Version '${input}' has unknown suffix. Only '-beta' is allowed.`,
      )
    }
    throw new InvalidVersionError(
      `Date portion must be YYYY-MM-DD (got: '${date}')`,
    )
  }

  // Validate the date is semantically valid (no Feb 30, etc.).
  const [, yyyy, mm, dd] = dateMatch
  const parsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`)
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(yyyy) ||
    parsed.getUTCMonth() + 1 !== Number(mm) ||
    parsed.getUTCDate() !== Number(dd)
  ) {
    throw new InvalidVersionError(`Date '${date}' is not a valid calendar date`)
  }

  const suffix = beta ? '-beta' : ''
  return {
    type,
    date,
    beta,
    canonical: `${type}@${date}${suffix}`,
    dir: `${type}/${date}${suffix}`,
  }
}
