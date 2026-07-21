import { getSummary, type D1Database } from '../../utils/db'

// GET /api/feedback/summary?system=<key> — segmented aggregate feeding the
// compare view (U8 / R6). Counts stay split by respondent type, never
// merged (AE3).
export default defineEventHandler(async (event) => {
  const db = (event.context as { cloudflare?: { env?: { FEEDBACK_DB?: D1Database } } })
    .cloudflare?.env?.FEEDBACK_DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Feedback store unavailable' })
  }

  const system = getQuery(event).system
  if (typeof system !== 'string' || system.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'system query param is required' })
  }

  const rows = await getSummary(db, system.trim())
  return { system: system.trim(), rows }
})
