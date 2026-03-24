import { generateInnerIcons } from '~/lib/recraft-generator'
import { compositeIconFromFullSvg } from '~/lib/icon-compositor'
import { getShapeFromCategories, type ShapeType } from '~/lib/icon-shapes'
import { getProvider } from '~/server/utils/provider'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.recraftApiKey) {
    throw createError({ statusCode: 500, message: 'RECRAFT_API_KEY not configured' })
  }

  const body = await readBody(event)
  const { elementId, shape: shapeOverride, prompt: promptOverride, model, colors, n, styleId } = body as {
    elementId?: string
    shape?: ShapeType
    prompt?: string
    model?: string
    colors?: [number, number, number][]
    n?: number
    styleId?: string
  }

  if (!elementId) {
    throw createError({ statusCode: 400, message: 'elementId is required' })
  }

  const provider = getProvider()

  // Get element info
  const element = await provider.readFile('elements', 'en', elementId)
  const fm = element.frontmatter

  // Generate inner icons via Recraft V4 (multiple)
  const innerSvgs = await generateInnerIcons(config.recraftApiKey, {
    elementId: fm.id,
    elementName: fm.name,
    elementDescription: fm.description,
    categories: fm.category || [],
  }, {
    prompt: promptOverride,
    model,
    colors,
    n: n ?? 3,
    styleId,
  })

  // Determine shape
  const shape = shapeOverride || getShapeFromCategories(fm.category || [])

  // Composite each result into light variant for preview
  const results = innerSvgs.map((innerSvg) => ({
    innerSvg,
    light: compositeIconFromFullSvg(innerSvg, shape, 'light'),
  }))

  return {
    success: true,
    elementId: fm.id,
    shape,
    results,
  }
})
