import OpenAI from 'openai'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { type ShapeType, type ShapeVariant, getShapeFromCategories } from './icon-shapes'
import { compositeIconFromFullSvg } from './icon-compositor'
import { buildDefaultPrompt } from './recraft-config'
import type { IconGenerationRequest, RecraftOptions } from './recraft-config'

// Re-export so existing server/CLI consumers don't need to change imports
export { buildDefaultPrompt, RECRAFT_MODELS } from './recraft-config'
export type { IconGenerationRequest, RecraftOptions } from './recraft-config'

export interface IconGenerationResult {
  svg: string
  innerSvg: string
  shape: ShapeType
  filePath?: string
}

export async function generateInnerIcon(
  apiKey: string,
  request: IconGenerationRequest,
  options?: RecraftOptions,
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://external.api.recraft.ai/v1',
  })

  const prompt = options?.prompt || buildDefaultPrompt(request)
  const model = options?.model || 'recraftv4_vector'

  const generateParams: Record<string, any> = {
    model,
    prompt,
    n: 1,
    response_format: 'url',
    size: '1024x1024',
  }

  // V4 supports controls for colors
  if (options?.colors?.length) {
    generateParams.controls = {
      colors: options.colors.map(([r, g, b]) => ({ rgb: [r, g, b] })),
    }
  }

  const response = await client.images.generate(generateParams as any)

  const imageUrl = response.data?.[0]?.url
  if (!imageUrl) {
    throw new Error('No image returned from Recraft API')
  }

  const svgResponse = await fetch(imageUrl)
  return await svgResponse.text()
}

export async function generateIcon(
  apiKey: string,
  iconsDir: string,
  request: IconGenerationRequest,
  options?: { variant?: ShapeVariant; save?: boolean } & RecraftOptions,
): Promise<IconGenerationResult> {
  const variant = options?.variant ?? 'light'
  const save = options?.save ?? true

  // Generate inner icon via Recraft
  const innerSvg = await generateInnerIcon(apiKey, request, options)

  // Determine shape from categories
  const shape = getShapeFromCategories(request.categories)

  // Composite inner icon + shape
  const svg = compositeIconFromFullSvg(innerSvg, shape, variant)

  const result: IconGenerationResult = { svg, innerSvg, shape }

  // Optionally save to disk
  if (save) {
    const fileName = `${request.elementId}.svg`
    const filePath = join(iconsDir, fileName)
    await writeFile(filePath, svg, 'utf-8')
    result.filePath = filePath
  }

  return result
}
