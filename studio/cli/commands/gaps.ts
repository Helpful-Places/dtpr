import { Command } from 'commander'
import { resolve } from 'path'
import { LocalContentProvider } from '../../lib/content-reader'
import { analyzeGaps } from '../../lib/gap-analyzer'

export const gapsCommand = new Command('gaps')
  .description('Analyze taxonomy gaps (missing translations, icons, validation errors)')
  .option('-c, --content-dir <dir>', 'Content directory', resolve(process.cwd(), '..', 'app', 'content', 'dtpr.v1'))
  .option('-i, --icons-dir <dir>', 'Icons directory', resolve(process.cwd(), '..', 'app', 'public', 'dtpr-icons'))
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const provider = new LocalContentProvider(opts.contentDir, opts.iconsDir)
    const report = await analyzeGaps(provider, opts.iconsDir)

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2))
      return
    }

    const s = report.summary
    console.log('\n📊 DTPR Taxonomy Gap Analysis')
    console.log('═'.repeat(40))
    console.log(`  Elements:    ${s.totalElements}`)
    console.log(`  Categories:  ${s.totalCategories}`)
    console.log(`  Locales:     ${s.totalLocales}`)
    console.log(`  Icons:       ${s.totalIcons}`)
    console.log()

    if (s.missingTranslationCount > 0) {
      console.log(`❌ Missing translations: ${s.missingTranslationCount}`)
      for (const mt of report.missingTranslations.slice(0, 10)) {
        console.log(`   ${mt.elementId}: missing ${mt.missingLocales.join(', ')}`)
      }
      if (report.missingTranslations.length > 10) {
        console.log(`   ... and ${report.missingTranslations.length - 10} more`)
      }
      console.log()
    }

    if (s.missingIconCount > 0) {
      console.log(`🖼️  Missing icons: ${s.missingIconCount}`)
      for (const id of report.missingIcons.slice(0, 10)) {
        console.log(`   ${id}`)
      }
      if (report.missingIcons.length > 10) {
        console.log(`   ... and ${report.missingIcons.length - 10} more`)
      }
      console.log()
    }

    if (s.staleTranslationCount > 0) {
      console.log(`⚠️  Stale translations: ${s.staleTranslationCount}`)
      for (const st of report.staleTranslations.slice(0, 10)) {
        console.log(`   ${st.elementId} (${st.locale}): source ${st.sourceUpdatedAt} > translation ${st.translationUpdatedAt}`)
      }
      console.log()
    }

    if (report.sparseCategories.length > 0) {
      console.log(`📁 Sparse categories (< ${Math.floor(report.sparseCategories[0]?.medianCount / 2)} elements):`)
      for (const sc of report.sparseCategories) {
        console.log(`   ${sc.categoryId}: ${sc.elementCount} elements (median: ${sc.medianCount})`)
      }
      console.log()
    }

    if (report.orphanedElements.length > 0) {
      console.log(`🔗 Orphaned elements (referencing nonexistent categories):`)
      for (const oe of report.orphanedElements) {
        console.log(`   ${oe.elementId} → ${oe.referencedCategory}`)
      }
      console.log()
    }

    if (s.validationErrorCount > 0) {
      console.log(`🚫 Validation errors: ${s.validationErrorCount}`)
      for (const ve of report.validationErrors.slice(0, 10)) {
        console.log(`   ${ve.file}: ${ve.message}`)
      }
      console.log()
    }

    if (s.missingTranslationCount === 0 && s.missingIconCount === 0 && s.validationErrorCount === 0) {
      console.log('✅ No critical gaps found!')
    }
  })
