import { Command } from 'commander'
import { readFile, writeFile, readdir } from 'fs/promises'
import { join, resolve } from 'path'

const LOCALES = ['en', 'es', 'fr', 'km', 'pt', 'tl']

export const updateSymbolsCommand = new Command('update-symbols')
  .description('Add symbol field to element frontmatter across all locales')
  .option('--dry-run', 'Report what would change without writing files')
  .option('-c, --content-dir <dir>', 'Content directory', resolve(process.cwd(), '..', 'app', 'content', 'dtpr.v1'))
  .option('-i, --icons-dir <dir>', 'Icons directory', resolve(process.cwd(), '..', 'app', 'public', 'dtpr-icons'))
  .action(async (opts) => {
    const symbolsDir = join(opts.iconsDir, 'symbols')

    // Get available symbols
    let symbolFiles: string[]
    try {
      symbolFiles = (await readdir(symbolsDir)).filter((f) => f.endsWith('.svg'))
    } catch {
      console.error('No symbols directory found. Run extract-symbols first.')
      process.exit(1)
    }

    const symbolIds = new Set(symbolFiles.map((f) => f.replace('.svg', '')))
    console.log(`Found ${symbolIds.size} symbols`)

    let updatedCount = 0
    let skippedCount = 0

    for (const locale of LOCALES) {
      const elementsDir = join(opts.contentDir, 'elements', locale)
      let files: string[]
      try {
        files = (await readdir(elementsDir)).filter((f) => f.endsWith('.md'))
      } catch {
        console.log(`  Skipping locale ${locale} (directory not found)`)
        continue
      }

      for (const file of files) {
        const filePath = join(elementsDir, file)
        const content = await readFile(filePath, 'utf-8')

        // Extract the element ID from frontmatter
        const idMatch = content.match(/^id:\s*(.+)$/m)
        if (!idMatch) {
          console.log(`  ⚠️  ${locale}/${file}: no id field found`)
          continue
        }

        const elementId = idMatch[1].trim()

        // Check if symbol exists for this element
        if (!symbolIds.has(elementId)) {
          skippedCount++
          continue
        }

        // Check if symbol field already exists
        if (/^symbol:/m.test(content)) {
          skippedCount++
          continue
        }

        // Add symbol field after the icon field
        const symbolPath = `/dtpr-icons/symbols/${elementId}.svg`
        let updatedContent: string

        if (/^icon:/m.test(content)) {
          // Add symbol right after the icon line
          updatedContent = content.replace(
            /^(icon:\s*.+)$/m,
            `$1\nsymbol: ${symbolPath}`,
          )
        } else {
          // No icon field — add symbol before the closing ---
          // Find the second --- (end of frontmatter)
          const parts = content.split('---')
          if (parts.length >= 3) {
            parts[1] = parts[1].trimEnd() + `\nsymbol: ${symbolPath}\n`
            updatedContent = parts.join('---')
          } else {
            console.log(`  ⚠️  ${locale}/${file}: could not parse frontmatter`)
            continue
          }
        }

        if (!opts.dryRun) {
          await writeFile(filePath, updatedContent, 'utf-8')
        }

        updatedCount++
      }

      console.log(`  ${locale}: processed`)
    }

    console.log(`\n📊 Results: ${updatedCount} files updated, ${skippedCount} skipped`)
    if (opts.dryRun) {
      console.log('  (dry run — no files written)')
    }
  })
