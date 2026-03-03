import OpenAI from 'openai'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export interface IconGenerationRequest {
  elementId: string
  elementName: string
  elementDescription: string
}

export interface IconGenerationResult {
  svg: string
  filePath: string
}

export async function generateIcon(
  apiKey: string,
  iconsDir: string,
  request: IconGenerationRequest,
): Promise<IconGenerationResult> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://external.api.recraft.ai/v1',
  })

  const prompt = `Simple line icon of "${request.elementName}": ${request.elementDescription}. Style: minimal line art, 36x36 viewBox, black stroke on transparent background, rounded rectangle border, clean simple lines, matching DTPR icon style.`

  const response = await client.images.generate({
    model: 'recraftv3',
    prompt,
    n: 1,
    response_format: 'url',
    style: 'vector_illustration' as any,
    // @ts-expect-error - Recraft-specific parameter
    substyle: 'line_art',
    // @ts-expect-error - Recraft-specific parameter
    size: '1024x1024',
  })

  const imageUrl = response.data[0]?.url
  if (!imageUrl) {
    throw new Error('No image returned from Recraft API')
  }

  // Fetch the SVG content
  const svgResponse = await fetch(imageUrl)
  const svg = await svgResponse.text()

  // Write to icons directory
  const fileName = `${request.elementId}.svg`
  const filePath = join(iconsDir, fileName)
  await writeFile(filePath, svg, 'utf-8')

  return { svg, filePath }
}
