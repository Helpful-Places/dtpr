import { compositeIconFromFullSvg } from '~/lib/icon-compositor'
import type { ShapeType, ShapeVariant } from '~/lib/icon-shapes'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { innerSvg, shape, variant, color } = body as {
    innerSvg: string
    shape: ShapeType
    variant?: ShapeVariant
    color?: string
  }

  if (!innerSvg || !shape) {
    throw createError({ statusCode: 400, message: 'innerSvg and shape are required' })
  }

  return {
    light: compositeIconFromFullSvg(innerSvg, shape, 'light'),
    dark: compositeIconFromFullSvg(innerSvg, shape, 'dark'),
    colored: compositeIconFromFullSvg(innerSvg, shape, 'colored', color || '#FFDD00'),
  }
})
