import { createError, type H3Event } from 'h3'
import type { D1Database } from './db'

// The feedback D1 binding is reached via the Cloudflare env on the request
// context. Both feedback routes need it plus the same "unavailable" guard,
// so it lives here (auto-imported by Nitro).
export function requireFeedbackDb(event: H3Event): D1Database {
  const db = (event.context as { cloudflare?: { env?: { FEEDBACK_DB?: D1Database } } })
    .cloudflare?.env?.FEEDBACK_DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Feedback store unavailable' })
  }
  return db
}
