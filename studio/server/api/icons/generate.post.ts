import { writeFile } from 'fs/promises'
import { join } from 'path'
import { generateInnerIcon } from '~/lib/recraft-generator'
import { compositeIconFromFullSvg } from '~/lib/icon-compositor'
import { getShapeFromCategories, type ShapeVariant, type ShapeType } from '~/lib/icon-shapes'
import { getProvider } from '~/server/utils/provider'
import { getIconsDir } from '~/server/utils/paths'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.recraftApiKey) {
    throw createError({ statusCode: 500, message: 'RECRAFT_API_KEY not configured' })
  }

  const body = await readBody(event)
  const { elementId, save, variant, shape: shapeOverride, prompt: promptOverride, model, colors } = body as {
    elementId?: string
    save?: boolean
    variant?: ShapeVariant
    shape?: ShapeType
    prompt?: string
    model?: string
    colors?: [number, number, number][]
  }

  if (!elementId) {
    throw createError({ statusCode: 400, message: 'elementId is required' })
  }

  const provider = getProvider()
  const iconsDir = getIconsDir()

  // Get element info
  const element = await provider.readFile('elements', 'en', elementId)
  const fm = element.frontmatter

  // Generate inner icon via Recraft V4
  const innerSvg = await generateInnerIcon(config.recraftApiKey, {
    elementId: fm.id,
    elementName: fm.name,
    elementDescription: fm.description,
    categories: fm.category || [],
  }, {
    prompt: promptOverride,
    model,
    colors,
  })

  // Determine shape — use override if provided, otherwise derive from categories
  const shape = shapeOverride || getShapeFromCategories(fm.category || [])

  // Composite all three variants for preview
  const variants = {
    light: compositeIconFromFullSvg(innerSvg, shape, 'light'),
    dark: compositeIconFromFullSvg(innerSvg, shape, 'dark'),
    colored: compositeIconFromFullSvg(innerSvg, shape, 'colored', '#FFDD00'),
  }

  // The saved version uses the requested variant (default: light)
  const saveVariant = variant || 'light'
  let filePath: string | undefined

  if (save) {
    const fileName = `${fm.id}.svg`
    filePath = join(iconsDir, fileName)
    await writeFile(filePath, variants[saveVariant], 'utf-8')
  }

  return {
    success: true,
    elementId: fm.id,
    shape,
    innerSvg,
    variants,
    filePath,
    saved: !!save,
  }
})
