import { getSummary } from '../../utils/db'
import { requireFeedbackDb } from '../../utils/require-db'

// GET /api/feedback/summary?system=<key> — segmented aggregate feeding the
// compare view (U8 / R6). Counts stay split by respondent type, never
// merged (AE3).
export default defineEventHandler(async (event) => {
  const db = requireFeedbackDb(event)

  const system = getQuery(event).system
  if (typeof system !== 'string' || system.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'system query param is required' })
  }

  const rows = await getSummary(db, system.trim())
  return { system: system.trim(), rows }
})
