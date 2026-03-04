import { Command } from 'commander'
import { resolve } from 'path'
import { LocalContentProvider } from '../../lib/content-reader'
import { generateIcon } from '../../lib/recraft-generator'
import { analyzeGaps } from '../../lib/gap-analyzer'
import type { ShapeVariant } from '../../lib/icon-shapes'

export const iconsCommand = new Command('icons')
  .description('Manage DTPR icons')
  .option('--missing', 'List elements without icons')
  .option('--generate <id>', 'Generate icon for a specific element')
  .option('--variant <variant>', 'Icon variant: light, dark, colored', 'light')
  .option('-c, --content-dir <dir>', 'Content directory', resolve(process.cwd(), '..', 'app', 'content', 'dtpr.v1'))
  .option('-i, --icons-dir <dir>', 'Icons directory', resolve(process.cwd(), '..', 'app', 'public', 'dtpr-icons'))
  .action(async (opts) => {
    const provider = new LocalContentProvider(opts.contentDir, opts.iconsDir)

    if (opts.missing) {
      const report = await analyzeGaps(provider, opts.iconsDir)
      if (report.missingIcons.length === 0) {
        console.log('\n✅ All elements have icons!')
        return
      }
      console.log(`\n🖼️  ${report.missingIcons.length} elements without icons:`)
      for (const id of report.missingIcons) {
        console.log(`  ${id}`)
      }
      return
    }

    if (opts.generate) {
      const apiKey = process.env.RECRAFT_API_KEY
      if (!apiKey) {
        console.error('❌ RECRAFT_API_KEY environment variable is required')
        process.exit(1)
      }

      const variant = opts.variant as ShapeVariant
      const element = await provider.readFile('elements', 'en', opts.generate)
      const fm = element.frontmatter

      console.log(`\n🎨 Generating icon for: ${fm.name} (${fm.id})`)
      console.log(`  Description: ${fm.description}`)
      console.log(`  Categories: ${fm.category?.join(', ') || 'none'}`)
      console.log(`  Variant: ${variant}`)

      const result = await generateIcon(apiKey, opts.iconsDir, {
        elementId: fm.id,
        elementName: fm.name,
        elementDescription: fm.description,
        categories: fm.category || [],
      }, { variant, save: true })

      console.log(`  Shape: ${result.shape}`)
      console.log(`  ✅ Icon saved: ${result.filePath} (${result.svg.length} bytes)`)
      return
    }

    // Default: show icon stats
    const icons = await provider.listIcons()
    const elements = await provider.getAllElements('en')
    console.log(`\n🖼️  Icon Stats`)
    console.log(`  Total icons: ${icons.length}`)
    console.log(`  Total elements: ${elements.length}`)
    console.log(`  Coverage: ${Math.round((icons.length / elements.length) * 100)}%`)
  })
