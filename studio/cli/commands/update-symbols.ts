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

    const symbolIds = new Set(symbolFiles)
    console.log(`Found ${symbolIds.size} symbols`)

    let updatedCount = 0
    let skippedCount = 0
    let missingCount = 0

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

        // Extract the icon path from frontmatter to derive the symbol filename
        const iconMatch = content.match(/^icon:\s*(.+)$/m)
        if (!iconMatch) {
          missingCount++
          continue
        }

        // The symbol filename matches the icon filename
        const iconPath = iconMatch[1].trim()
        const iconFileName = iconPath.split('/').pop() || ''
        if (!iconFileName || !symbolIds.has(iconFileName)) {
          missingCount++
          continue
        }

        const symbolPath = `/dtpr-icons/symbols/${iconFileName}`

        // Check if symbol field already exists with correct value
        const symbolRegex = /^symbol:\s*(.+)$/m
        const existingSymbol = content.match(symbolRegex)
        if (existingSymbol && existingSymbol[1].trim() === symbolPath) {
          skippedCount++
          continue
        }

        let updatedContent: string

        if (existingSymbol) {
          // Update existing symbol field
          updatedContent = content.replace(symbolRegex, `symbol: ${symbolPath}`)
        } else {
          // Add symbol right after the icon line
          updatedContent = content.replace(
            /^(icon:\s*.+)$/m,
            `$1\nsymbol: ${symbolPath}`,
          )
        }

        if (!opts.dryRun) {
          await writeFile(filePath, updatedContent, 'utf-8')
        }

        updatedCount++
      }

      console.log(`  ${locale}: processed`)
    }

    console.log(`\n📊 Results: ${updatedCount} updated, ${skippedCount} already correct, ${missingCount} no matching symbol`)
    if (opts.dryRun) {
      console.log('  (dry run — no files written)')
    }
  })
