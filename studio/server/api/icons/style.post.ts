import { readFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { getIconsDir } from '~/server/utils/paths'

/**
 * Creates a Recraft style from reference SVG symbols.
 * Converts SVGs to PNGs (Recraft requires raster images), uploads them,
 * and returns a style_id for use in generation.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.recraftApiKey) {
    throw createError({ statusCode: 500, message: 'RECRAFT_API_KEY not configured' })
  }

  const body = await readBody(event)
  const { symbolIds, baseStyle } = body as {
    symbolIds: string[]
    baseStyle?: string
  }

  if (!symbolIds?.length) {
    throw createError({ statusCode: 400, message: 'symbolIds is required (array of symbol file names)' })
  }

  if (symbolIds.length > 5) {
    throw createError({ statusCode: 400, message: 'Maximum 5 reference symbols allowed' })
  }

  const symbolsDir = join(getIconsDir(), 'symbols')

  // Read SVGs and convert to PNG buffers
  const pngBuffers: { name: string; buffer: Buffer }[] = []
  for (const id of symbolIds) {
    try {
      const fileName = id.endsWith('.svg') ? id : `${id}.svg`
      const svgContent = await readFile(join(symbolsDir, fileName), 'utf-8')

      // Convert SVG to 512x512 PNG for style reference
      const pngBuffer = await sharp(Buffer.from(svgContent))
        .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer()

      pngBuffers.push({ name: fileName.replace('.svg', '.png'), buffer: pngBuffer })
    } catch (e: any) {
      console.warn(`Skipping symbol ${id}: ${e.message}`)
    }
  }

  if (pngBuffers.length === 0) {
    throw createError({ statusCode: 400, message: 'No valid symbols could be converted' })
  }

  // Upload to Recraft style endpoint via multipart form
  const formData = new FormData()
  formData.append('style', baseStyle || 'digital_illustration')

  for (let i = 0; i < pngBuffers.length; i++) {
    const blob = new Blob([pngBuffers[i].buffer], { type: 'image/png' })
    formData.append(`file${i > 0 ? i + 1 : ''}`, blob, pngBuffers[i].name)
  }

  const response = await fetch('https://external.api.recraft.ai/v1/styles', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.recraftApiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw createError({
      statusCode: response.status,
      message: `Recraft style creation failed: ${errorText}`,
    })
  }

  const result = await response.json() as { id: string }

  return {
    styleId: result.id,
    symbolCount: pngBuffers.length,
  }
})
