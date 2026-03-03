import { getGitStatus } from '~/server/utils/git'

export default defineEventHandler(async () => {
  return getGitStatus()
})
