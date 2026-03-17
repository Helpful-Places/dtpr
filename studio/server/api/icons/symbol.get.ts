import { readFile } from 'fs/promises'
import { join } from 'path'
import { getIconsDir } from '~/server/utils/paths'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    throw createError({ statusCode: 400, message: 'id parameter required' })
  }

  const symbolsDir = join(getIconsDir(), 'symbols')
  const fileName = id.endsWith('.svg') ? id : `${id}.svg`

  try {
    const content = await readFile(join(symbolsDir, fileName), 'utf-8')
    setResponseHeader(event, 'content-type', 'image/svg+xml')
    return content
  } catch {
    throw createError({ statusCode: 404, message: `Symbol not found: ${fileName}` })
  }
})
