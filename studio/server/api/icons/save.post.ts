import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getIconsDir } from '~/server/utils/paths'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { elementId, svg } = body as { elementId?: string; svg?: string }

  if (!elementId || !svg) {
    throw createError({ statusCode: 400, message: 'elementId and svg are required' })
  }

  const iconsDir = getIconsDir()
  const fileName = `${elementId}.svg`
  const filePath = join(iconsDir, fileName)
  await writeFile(filePath, svg, 'utf-8')

  return {
    success: true,
    elementId,
    filePath,
  }
})
