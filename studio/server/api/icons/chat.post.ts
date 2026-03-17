import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages } from 'ai'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { getProvider } from '~/server/utils/provider'
import { getIconsDir } from '~/server/utils/paths'

async function readSymbolSvgs(symbolFileNames: string[]): Promise<{ name: string; svg: string }[]> {
  const symbolsDir = join(getIconsDir(), 'symbols')
  const results: { name: string; svg: string }[] = []

  for (const fileName of symbolFileNames.slice(0, 5)) {
    try {
      const safeName = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`
      const svg = await readFile(join(symbolsDir, safeName), 'utf-8')
      results.push({ name: safeName.replace('.svg', ''), svg })
    } catch {
      // Skip missing symbols
    }
  }

  return results
}

function buildSystemPrompt(
  elementName: string,
  elementDescription: string,
  categories: string[],
  shapeName: string,
  referenceSymbols: { name: string; svg: string }[],
): string {
  let prompt = `You are a visual design consultant for DTPR (Digital Trust for Places & Routines), a transparency signage system for public spaces — like nutrition labels, but for digital technology in physical spaces.

## Your Task
Help the user brainstorm how to visually represent a DTPR concept as a small symbol. Work through visual metaphors conversationally — propose ideas, discuss trade-offs, and iterate based on feedback.

## Symbol Constraints
- Symbols are 36×36px SVG, monochrome (single color, no gradients)
- Style: clean geometric line art, simple enough to read at small sizes
- Just the inner graphic — no outer shape, border, or background
- Must be universally understandable, not culturally specific
- Should work across light/dark backgrounds (uses currentColor)

## Current Element
- **Name**: ${elementName}
- **Description**: ${elementDescription}
- **Categories**: ${categories.join(', ')}

## How to Help
1. Propose 3-5 concrete visual metaphors — describe what shapes, lines, and forms would make up each option
2. Explain why each metaphor communicates the concept effectively
3. Discuss which would work best at very small sizes
4. Iterate based on the user's preferences
5. When the user is happy with a direction, say so clearly — they'll use the agreed concept to generate a Recraft prompt`

  if (referenceSymbols.length > 0) {
    prompt += `\n\n## Reference Symbols (SVG source)\nHere are ${referenceSymbols.length} existing symbols from the DTPR set. Analyze their visual language (stroke weight, geometric vocabulary, level of abstraction) and ensure your suggestions are stylistically compatible.\n`
    for (const sym of referenceSymbols) {
      prompt += `\n### ${sym.name}\n\`\`\`svg\n${sym.svg}\n\`\`\`\n`
    }
  }

  return prompt
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured' })
  }

  const body = await readBody(event)
  const { messages, elementId, referenceSymbols: referenceSymbolNames } = body as {
    messages: any[]
    elementId: string
    referenceSymbols?: string[]
  }

  if (!elementId || !messages) {
    throw createError({ statusCode: 400, message: 'elementId and messages are required' })
  }

  // Get element info
  const provider = getProvider()
  const element = await provider.readFile('elements', 'en', elementId)
  const fm = element.frontmatter

  // Determine shape name from categories
  const { getShapeFromCategories } = await import('~/lib/icon-shapes')
  const shapeName = getShapeFromCategories(fm.category || [])

  // Read reference symbol SVGs
  const referenceSymbols = referenceSymbolNames?.length
    ? await readSymbolSvgs(referenceSymbolNames)
    : []

  const systemPrompt = buildSystemPrompt(
    fm.name,
    fm.description,
    fm.category || [],
    shapeName,
    referenceSymbols,
  )

  const anthropic = createAnthropic({ apiKey: config.anthropicApiKey })

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
})
