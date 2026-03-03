import { generateIcon } from '~/lib/recraft-generator'
import { getProvider } from '~/server/utils/provider'
import { getIconsDir } from '~/server/utils/paths'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.recraftApiKey) {
    throw createError({ statusCode: 500, message: 'RECRAFT_API_KEY not configured' })
  }

  const body = await readBody(event)
  const { elementId } = body

  if (!elementId) {
    throw createError({ statusCode: 400, message: 'elementId is required' })
  }

  const provider = getProvider()
  const iconsDir = getIconsDir()

  // Get element info for the prompt
  const element = await provider.readFile('elements', 'en', elementId)
  const fm = element.frontmatter

  const result = await generateIcon(config.recraftApiKey, iconsDir, {
    elementId: fm.id,
    elementName: fm.name,
    elementDescription: fm.description,
  })

  return {
    success: true,
    elementId,
    filePath: result.filePath,
    svgLength: result.svg.length,
  }
})
