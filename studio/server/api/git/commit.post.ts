import { gitCommit } from '~/server/utils/git'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { message, files } = body

  if (!message) {
    throw createError({ statusCode: 400, message: 'Commit message is required' })
  }

  return gitCommit(message, files)
})
