// Adds an address to the DTPR newsletter list on Mailcoach. Mailcoach sends
// the confirmation email, so nothing is stored here.
const MAILCOACH_LIST = 'https://helpful-places.mailcoach.app/subscribe/3f3c6a33-15d3-4607-9c07-fb49d65b5006'

export default defineEventHandler(async (event) => {
  const { email } = await readBody<{ email?: unknown }>(event) ?? {}
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email address is required' })
  }

  const form = new URLSearchParams({ email: email.trim(), tags: 'dtpr.io' })
  try {
    await $fetch(MAILCOACH_LIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'The newsletter service is not responding' })
  }

  return { success: true }
})
