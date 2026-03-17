import { Command } from 'commander'
import { resolve, basename } from 'path'
import { LocalContentProvider } from '../../lib/content-reader'
import { translateElement } from '../../lib/claude-translator'
import { writeMarkdownFile, serializeFrontmatter } from '../../lib/content-writer'
import { LOCALES } from '../../lib/types'
import type { Locale } from '../../lib/types'

export const translateCommand = new Command('translate')
  .description('Translate elements using Claude AI')
  .requiredOption('-t, --target <locale>', 'Target locale (e.g. "es") or "all"')
  .option('-s, --source <locale>', 'Source locale', 'en')
  .option('--skip-existing', 'Skip elements that already have translations')
  .option('--dry-run', 'Show what would be translated without writing files')
  .option('--concurrency <n>', 'Max concurrent translations', '3')
  .option('-c, --content-dir <dir>', 'Content directory', resolve(process.cwd(), '..', 'app', 'content', 'dtpr.v1'))
  .option('-i, --icons-dir <dir>', 'Icons directory', resolve(process.cwd(), '..', 'app', 'public', 'dtpr-icons'))
  .action(async (opts) => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY environment variable is required')
      process.exit(1)
    }

    const provider = new LocalContentProvider(opts.contentDir, opts.iconsDir)
    const sourceLocale = opts.source as Locale
    const concurrency = parseInt(opts.concurrency)

    const targetLocales: Locale[] =
      opts.target === 'all'
        ? LOCALES.filter((l) => l !== sourceLocale)
        : [opts.target as Locale]

    const sourceElements = await provider.getAllElements(sourceLocale)
    console.log(`\n📝 Source: ${sourceElements.length} elements in ${sourceLocale}`)

    for (const targetLocale of targetLocales) {
      console.log(`\n🌐 Translating to ${targetLocale}...`)

      const targetElements = await provider.getAllElements(targetLocale)
      const targetIds = new Set(targetElements.map((e) => e.frontmatter.id))

      const toTranslate = opts.skipExisting
        ? sourceElements.filter((e) => !targetIds.has(e.frontmatter.id))
        : sourceElements

      console.log(`  ${toTranslate.length} elements to translate (${opts.skipExisting ? 'skipping existing' : 'all'})`)

      if (opts.dryRun) {
        for (const el of toTranslate) {
          console.log(`  [dry-run] Would translate: ${el.frontmatter.name} (${el.frontmatter.id})`)
        }
        continue
      }

      let translated = 0
      let errors = 0

      for (let i = 0; i < toTranslate.length; i += concurrency) {
        const batch = toTranslate.slice(i, i + concurrency)
        const results = await Promise.allSettled(
          batch.map(async (el) => {
            const fm = el.frontmatter
            const translation = await translateElement(apiKey, {
              sourceLocale,
              targetLocale,
              name: fm.name,
              description: fm.description,
              prompt: fm.prompt,
            })

            const fileName = basename(el.filePath)
            const now = new Date().toISOString().split('T')[0] + 'T00:00:00Z'
            const translatedFm = serializeFrontmatter({
              ...fm,
              name: translation.name,
              description: translation.description,
              ...(translation.prompt ? { prompt: translation.prompt } : {}),
              updated_at: now,
            })

            await writeMarkdownFile(opts.contentDir, 'elements', targetLocale, fileName, translatedFm)
            return fm.id
          }),
        )

        for (const res of results) {
          if (res.status === 'fulfilled') {
            translated++
            process.stdout.write(`  ✓ ${res.value} (${translated}/${toTranslate.length})\n`)
          } else {
            errors++
            process.stdout.write(`  ✗ Error: ${res.reason?.message}\n`)
          }
        }
      }

      console.log(`  Done: ${translated} translated, ${errors} errors`)
    }
  })
