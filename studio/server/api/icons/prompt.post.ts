import Anthropic from '@anthropic-ai/sdk'
import { readFile } from 'fs/promises'
import { join } from 'path'
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

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured' })
  }

  const body = await readBody(event)
  const { messages, elementName, elementDescription, referenceSymbols: referenceSymbolNames } = body as {
    messages: any[]
    elementName: string
    elementDescription: string
    referenceSymbols?: string[]
  }

  if (!messages || !elementName) {
    throw createError({ statusCode: 400, message: 'messages and elementName are required' })
  }

  // Read reference symbol SVGs for style analysis
  const referenceSymbols = referenceSymbolNames?.length
    ? await readSymbolSvgs(referenceSymbolNames)
    : []

  let styleContext = ''
  if (referenceSymbols.length > 0) {
    styleContext = `\n\nHere are reference symbol SVGs from the existing DTPR set. Analyze their visual characteristics (stroke weights, geometric shapes used, fill patterns, level of abstraction) and write the prompt to produce output in the same visual style:\n`
    for (const sym of referenceSymbols) {
      styleContext += `\n${sym.name}:\n\`\`\`svg\n${sym.svg}\n\`\`\`\n`
    }
  }

  const conversationSummary = messages
    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
    .map((m: any) => {
      const text = typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.parts)
          ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n')
          : ''
      return `${m.role}: ${text}`
    })
    .join('\n\n')

  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are a prompt engineer for Recraft V4 Vector, an AI SVG generator. Your job is to write a detailed prompt that will produce a clean, minimal icon symbol.

Key Recraft V4 constraints:
- Produces native SVG with clean vector paths
- No style parameter — all style direction must be in the prompt text
- Supports up to 10,000 character prompts
- Works best with structured prompts: subject, composition, medium, style, constraints

The DTPR icon system uses:
- 36×36px final size (but Recraft generates at 1024×1024, then we scale down)
- Monochrome (single color fill, no gradients, no shadows)
- Clean geometric line art
- No outer shape/border — just the inner symbol
- Transparent background

Write a prompt that will produce a single, centered icon symbol. Be very specific about visual elements, proportions, and style. Include explicit negative constraints (no gradients, no shadows, no text, no background shapes).${styleContext}`,
    messages: [{
      role: 'user',
      content: `Based on this brainstorm conversation, write a Recraft V4 prompt to generate an icon for "${elementName}" (${elementDescription}).

## Brainstorm Conversation
${conversationSummary}

Return ONLY a JSON object with this structure:
{
  "prompt": "the full Recraft prompt text",
  "suggestedColors": [[r,g,b], ...] // optional, 1-3 RGB colors if relevant
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw createError({ statusCode: 500, message: 'Failed to parse prompt response' })
  }

  return JSON.parse(jsonMatch[0])
})
