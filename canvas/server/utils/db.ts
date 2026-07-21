// Pure feedback data layer — validation, persistence, and aggregation
// against a minimal D1 interface. Kept free of h3/Nitro imports so it is
// unit-testable against a better-sqlite3-backed D1 shim (test/d1.ts);
// the route handlers supply the real `event.context.cloudflare.env.FEEDBACK_DB`.

// ── Minimal structural D1 interface (real D1 and the test shim both satisfy it) ──
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  run(): Promise<unknown>
  all<T = unknown>(): Promise<{ results: T[] }>
  first<T = unknown>(colName?: string): Promise<T | null>
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement
}

// ── Vocabularies (the one place these are enumerated) ──
export const REACTIONS = ['clear', 'confusing', 'unsure'] as const
export const SCOPES = ['seat', 'canvas'] as const
export const RESPONDENT_TYPES = ['public', 'professional'] as const

export type Reaction = (typeof REACTIONS)[number]
export type Scope = (typeof SCOPES)[number]
export type RespondentType = (typeof RESPONDENT_TYPES)[number]

export interface FeedbackInput {
  system: string
  variant: string
  version: string
  seat: string | null
  scope: Scope
  reaction: Reaction
  note: string | null
  respondent: {
    id: string
    type: RespondentType
    contact: string | null
  }
}

export type ValidationResult =
  | { ok: true, value: FeedbackInput }
  | { ok: false, error: string }

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const optionalString = (v: unknown): string | null =>
  isNonEmptyString(v) ? v.trim() : null

/**
 * Validate + normalize a raw POST body into a FeedbackInput.
 * Enforces the reaction/scope/respondent-type vocabularies and the
 * scope↔seat rule: a seat reaction records its seat, a canvas reaction
 * records none (AE4). Returns a discriminated result so the handler can
 * map failure to a 400 without this module importing h3.
 */
export function validateFeedback(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body is required' }
  const b = body as Record<string, unknown>

  if (!isNonEmptyString(b.system)) return { ok: false, error: 'system is required' }
  if (!isNonEmptyString(b.variant)) return { ok: false, error: 'variant is required' }
  if (!isNonEmptyString(b.version)) return { ok: false, error: 'version is required' }

  if (!isNonEmptyString(b.scope) || !SCOPES.includes(b.scope as Scope)) {
    return { ok: false, error: 'scope must be one of: ' + SCOPES.join(', ') }
  }
  const scope = b.scope as Scope

  if (!isNonEmptyString(b.reaction) || !REACTIONS.includes(b.reaction as Reaction)) {
    return { ok: false, error: 'reaction must be one of: ' + REACTIONS.join(', ') }
  }
  const reaction = b.reaction as Reaction

  // Seat is required for seat scope and forbidden (dropped) for canvas scope.
  let seat: string | null = null
  if (scope === 'seat') {
    if (!isNonEmptyString(b.seat)) return { ok: false, error: 'seat is required for scope "seat"' }
    seat = b.seat.trim()
  }

  const r = b.respondent
  if (!r || typeof r !== 'object') return { ok: false, error: 'respondent is required' }
  const rr = r as Record<string, unknown>
  if (!isNonEmptyString(rr.id)) return { ok: false, error: 'respondent.id is required' }
  if (!isNonEmptyString(rr.type) || !RESPONDENT_TYPES.includes(rr.type as RespondentType)) {
    return { ok: false, error: 'respondent.type must be one of: ' + RESPONDENT_TYPES.join(', ') }
  }

  return {
    ok: true,
    value: {
      system: b.system.trim(),
      variant: b.variant.trim(),
      version: b.version.trim(),
      seat,
      scope,
      reaction,
      note: optionalString(b.note),
      respondent: {
        id: rr.id.trim(),
        type: rr.type as RespondentType,
        contact: optionalString(rr.contact),
      },
    },
  }
}

/**
 * Persist a validated response: upsert the respondent (self-tag is set
 * once on first insert; a later contact fills in if newly provided) then
 * insert the response row. Returns the new response id.
 */
export async function insertFeedback(
  db: D1Database,
  input: FeedbackInput,
  now: number = Date.now(),
): Promise<string> {
  await db
    .prepare(
      `INSERT INTO respondent (respondent_id, respondent_type, contact, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(respondent_id) DO UPDATE SET
         contact = COALESCE(excluded.contact, respondent.contact)`,
    )
    .bind(input.respondent.id, input.respondent.type, input.respondent.contact, now)
    .run()

  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO feedback_response
         (id, respondent_id, system_key, variant_key, version_key, seat_key, scope, reaction, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.respondent.id,
      input.system,
      input.variant,
      input.version,
      input.seat,
      input.scope,
      input.reaction,
      input.note,
      now,
    )
    .run()

  return id
}

export interface SummaryRow {
  variant: string
  version: string
  seat: string | null
  reaction: Reaction
  respondentType: RespondentType
  count: number
}

/**
 * Aggregate a system's feedback grouped by
 * (variant, version, seat, reaction, respondent_type). Respondent type is
 * a grouping key, so public and professional counts are ALWAYS separate
 * rows and never merged into one number (AE3 / R12).
 */
export async function getSummary(db: D1Database, system: string): Promise<SummaryRow[]> {
  const { results } = await db
    .prepare(
      `SELECT fr.variant_key AS variant,
              fr.version_key AS version,
              fr.seat_key    AS seat,
              fr.reaction    AS reaction,
              r.respondent_type AS respondentType,
              COUNT(*)       AS count
         FROM feedback_response fr
         JOIN respondent r ON r.respondent_id = fr.respondent_id
        WHERE fr.system_key = ?
        GROUP BY fr.variant_key, fr.version_key, fr.seat_key, fr.reaction, r.respondent_type
        ORDER BY fr.variant_key, fr.version_key, fr.seat_key, fr.reaction`,
    )
    .bind(system)
    .all<SummaryRow>()
  return results
}
