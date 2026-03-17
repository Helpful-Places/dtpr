import { Command } from 'commander'
import { resolve } from 'path'
import { LocalContentProvider } from '../../lib/content-reader'
import { analyzeGaps } from '../../lib/gap-analyzer'

export const validateCommand = new Command('validate')
  .description('Check taxonomy consistency')
  .option('-c, --content-dir <dir>', 'Content directory', resolve(process.cwd(), '..', 'app', 'content', 'dtpr.v1'))
  .option('-i, --icons-dir <dir>', 'Icons directory', resolve(process.cwd(), '..', 'app', 'public', 'dtpr-icons'))
  .action(async (opts) => {
    const provider = new LocalContentProvider(opts.contentDir, opts.iconsDir)
    const report = await analyzeGaps(provider, opts.iconsDir)

    let hasErrors = false

    if (report.validationErrors.length > 0) {
      hasErrors = true
      console.log(`\n🚫 ${report.validationErrors.length} validation errors:`)
      for (const ve of report.validationErrors) {
        console.log(`  ${ve.file}`)
        console.log(`    ${ve.field}: ${ve.message}`)
      }
    }

    if (report.orphanedElements.length > 0) {
      hasErrors = true
      console.log(`\n🔗 ${report.orphanedElements.length} orphaned elements:`)
      for (const oe of report.orphanedElements) {
        console.log(`  ${oe.elementId} references nonexistent category: ${oe.referencedCategory}`)
      }
    }

    if (!hasErrors) {
      console.log('\n✅ Taxonomy is valid — no errors found.')
    } else {
      process.exit(1)
    }
  })
