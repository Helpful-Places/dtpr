import { validateFeedback, insertFeedback, type D1Database } from '../utils/db'

// POST /api/feedback — validate a reaction and persist it. Mirrors the
// validate-then-act shape of app/server/api/subscribe.post.ts. The D1
// binding is reached via the Cloudflare env on the request context.
export default defineEventHandler(async (event) => {
  const db = (event.context as { cloudflare?: { env?: { FEEDBACK_DB?: D1Database } } })
    .cloudflare?.env?.FEEDBACK_DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Feedback store unavailable' })
  }

  const body = await readBody(event)
  const result = validateFeedback(body)
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.error })
  }

  const id = await insertFeedback(db, result.value)
  return { success: true, id }
})
