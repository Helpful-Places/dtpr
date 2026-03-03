import { basename } from 'path'
import { translateElement } from '~/lib/claude-translator'
import { writeMarkdownFile, serializeFrontmatter } from '~/lib/content-writer'
import { getProvider } from '~/server/utils/provider'
import { getContentDir } from '~/server/utils/paths'
import type { Locale } from '~/lib/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured' })
  }

  const body = await readBody(event)
  const { elementIds, targetLocale, concurrency = 3 } = body as {
    elementIds: string[]
    targetLocale: Locale
    concurrency?: number
  }

  if (!elementIds?.length || !targetLocale) {
    throw createError({ statusCode: 400, message: 'elementIds and targetLocale are required' })
  }

  const provider = getProvider()
  const contentDir = getContentDir()
  let translated = 0
  const errors: { id: string; error: string }[] = []

  // Process in batches
  for (let i = 0; i < elementIds.length; i += concurrency) {
    const batch = elementIds.slice(i, i + concurrency)
    const results = await Promise.allSettled(
      batch.map(async (elementId) => {
        // Get English source
        const enFile = await provider.readFile('elements', 'en', elementId)
        const fm = enFile.frontmatter

        // Translate
        const translation = await translateElement(config.anthropicApiKey, {
          sourceLocale: 'en',
          targetLocale,
          name: fm.name,
          description: fm.description,
          prompt: fm.prompt,
        })

        // Write translated file
        const fileName = basename(enFile.filePath)
        const now = new Date().toISOString().split('T')[0] + 'T00:00:00Z'
        const translatedFm = serializeFrontmatter({
          ...fm,
          name: translation.name,
          description: translation.description,
          ...(translation.prompt ? { prompt: translation.prompt } : {}),
          updated_at: now,
        })

        await writeMarkdownFile(contentDir, 'elements', targetLocale, fileName, translatedFm)
        return elementId
      }),
    )

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        translated++
      } else {
        errors.push({
          id: batch[j],
          error: (results[j] as PromiseRejectedResult).reason?.message || 'Unknown error',
        })
      }
    }
  }

  return { translated, errors, total: elementIds.length }
})
