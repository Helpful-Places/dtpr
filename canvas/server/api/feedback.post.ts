import { validateFeedback, insertFeedback } from '../utils/db'
import { requireFeedbackDb } from '../utils/require-db'

// POST /api/feedback — validate a reaction and persist it. Mirrors the
// validate-then-act shape of app/server/api/subscribe.post.ts.
export default defineEventHandler(async (event) => {
  const db = requireFeedbackDb(event)

  const body = await readBody(event)
  const result = validateFeedback(body)
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.error })
  }

  const id = await insertFeedback(db, result.value)
  return { success: true, id }
})
