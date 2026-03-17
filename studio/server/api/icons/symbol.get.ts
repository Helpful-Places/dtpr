import { readFile } from 'fs/promises'
import { join, resolve, normalize } from 'path'
import { getIconsDir } from '~/server/utils/paths'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    throw createError({ statusCode: 400, message: 'id parameter required' })
  }

  const iconsDir = getIconsDir()
  const symbolsDir = join(iconsDir, 'symbols')
  const fileName = id.endsWith('.svg') ? id : `${id}.svg`

  // Resolve within the icons directory (supports ../shapes/foo.svg)
  const filePath = normalize(join(symbolsDir, fileName))

  // Ensure we stay within the icons directory
  if (!filePath.startsWith(normalize(iconsDir))) {
    throw createError({ statusCode: 400, message: 'Invalid path' })
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    setResponseHeader(event, 'content-type', 'image/svg+xml')
    return content
  } catch {
    throw createError({ statusCode: 404, message: `Not found: ${fileName}` })
  }
})
