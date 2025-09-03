#!/usr/bin/env node

/**
 * Sync and translate category attributes across locales
 * 
 * This script syncs non-translatable attributes (id, order, required, etc.) from English 
 * markdown files to all other locale versions and optionally translates text fields
 * (name, description, prompt, element_variables.label) using Google Translate.
 * 
 * Usage:
 *   node sync-categories.js [options]
 * 
 * Options:
 *   --dry-run        Show what would be changed without making actual changes
 *   --translate      Enable Google Translate for text fields
 *   --key-file       Path to Google service account key file (required if --translate)
 *   --skip-existing  Don't overwrite existing translated fields
 *   --locales        Comma-separated list of target locales (default: all)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { program } = require('commander');

// Get the project root
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');

// Configure command-line options
program
  .name('sync-categories')
  .description('Sync and translate category attributes across locales')
  .option('--dry-run', 'Show changes without modifying files')
  .option('--translate', 'Enable Google Translate for text fields')
  .option('-k, --key-file <path>', 'Path to Google service account key file')
  .option('--skip-existing', 'Don\'t overwrite existing translated fields')
  .option('--locales <locales>', 'Comma-separated list of target locales')
  .parse(process.argv);

const options = program.opts();

// Validate options
if (options.translate && !options.keyFile) {
  console.error('Error: --key-file is required when using --translate');
  process.exit(1);
}

// Initialize Google Translate if needed
let translate = null;
if (options.translate) {
  const { Translate } = require('@google-cloud/translate').v2;
  translate = new Translate({
    keyFilename: options.keyFile
  });
}

// Define content directory
const contentPath = path.join(projectRoot, 'content/dtpr.v1/categories');

// Define which attributes should be synced (non-translatable)
const SYNC_ATTRIBUTES = [
  'id',
  'required', 
  'order',
  'datachain_type'
];

// Define which attributes should be translated
const TRANSLATE_ATTRIBUTES = [
  'name',
  'description',
  'prompt'
];

// Statistics tracking
let stats = {
  processed: 0,
  synced: 0,
  translated: 0,
  skipped: 0,
  created: 0,
  errors: 0
};

/**
 * Translate text using Google Translate API
 */
async function translateText(text, targetLang) {
  if (!translate || !text) return null;
  
  try {
    const [translation] = await translate.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error('Translation error:', error.message);
    return null;
  }
}

/**
 * Process element_variables array
 * Syncs non-translatable fields and optionally translates labels
 */
async function processElementVariables(sourceVars, targetVars, targetLocale) {
  if (!sourceVars || !Array.isArray(sourceVars)) {
    return null;
  }
  
  const result = [];
  
  for (const sourceVar of sourceVars) {
    // Find matching variable in target by id
    let targetVar = targetVars?.find(v => v.id === sourceVar.id) || {};
    
    // Create new variable object with synced attributes
    const processedVar = {
      id: sourceVar.id  // Always sync id
    };
    
    // Translate or preserve label
    if (sourceVar.label) {
      if (options.translate && (!options.skipExisting || !targetVar.label)) {
        const translatedLabel = await translateText(sourceVar.label, targetLocale);
        processedVar.label = translatedLabel || targetVar.label || sourceVar.label;
      } else {
        processedVar.label = targetVar.label || sourceVar.label;
      }
    }
    
    // Sync non-translatable attributes
    if (sourceVar.hasOwnProperty('default')) {
      processedVar.default = sourceVar.default;
    }
    if (sourceVar.hasOwnProperty('required')) {
      processedVar.required = sourceVar.required;
    }
    
    result.push(processedVar);
  }
  
  return result;
}

/**
 * Process a single category file
 */
async function processFile(fileName, targetLocale) {
  const sourceFilePath = path.join(contentPath, 'en', fileName);
  const targetFilePath = path.join(contentPath, targetLocale, fileName);
  
  try {
    // Read source file
    const sourceContent = fs.readFileSync(sourceFilePath, 'utf8');
    const sourceData = matter(sourceContent);
    
    // Initialize target data
    let targetData = { data: {}, content: '' };
    let fileExists = false;
    
    // Read target file if it exists
    if (fs.existsSync(targetFilePath)) {
      fileExists = true;
      const targetContent = fs.readFileSync(targetFilePath, 'utf8');
      targetData = matter(targetContent);
    }
    
    // Start with existing target data or empty object
    const updatedData = { ...targetData.data };
    
    // Sync non-translatable attributes
    for (const attr of SYNC_ATTRIBUTES) {
      if (sourceData.data.hasOwnProperty(attr)) {
        updatedData[attr] = sourceData.data[attr];
      }
    }
    
    // Translate or sync text attributes
    for (const attr of TRANSLATE_ATTRIBUTES) {
      if (sourceData.data.hasOwnProperty(attr)) {
        if (options.translate && (!options.skipExisting || !targetData.data[attr])) {
          const translated = await translateText(sourceData.data[attr], targetLocale);
          if (translated) {
            updatedData[attr] = translated;
            stats.translated++;
          } else {
            updatedData[attr] = targetData.data[attr] || sourceData.data[attr];
          }
        } else {
          // Preserve existing translation or use source
          updatedData[attr] = targetData.data[attr] || sourceData.data[attr];
        }
      }
    }
    
    // Process element_variables
    if (sourceData.data.element_variables) {
      const processedVars = await processElementVariables(
        sourceData.data.element_variables,
        targetData.data.element_variables,
        targetLocale
      );
      if (processedVars) {
        updatedData.element_variables = processedVars;
      }
    }
    
    // Check if we need to update the file
    const needsUpdate = JSON.stringify(updatedData) !== JSON.stringify(targetData.data);
    
    if (needsUpdate || !fileExists) {
      // Generate updated content
      const updatedContent = matter.stringify(targetData.content || '', updatedData);
      
      // Log changes
      console.log(`${fileExists ? 'Updating' : 'Creating'} ${targetLocale}/${fileName}`);
      
      if (!options.dryRun) {
        // Ensure target directory exists
        const targetDir = path.dirname(targetFilePath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Write the file
        fs.writeFileSync(targetFilePath, updatedContent);
      }
      
      if (fileExists) {
        stats.synced++;
      } else {
        stats.created++;
      }
    } else {
      stats.skipped++;
    }
    
    stats.processed++;
    
  } catch (error) {
    console.error(`Error processing ${fileName} for ${targetLocale}:`, error.message);
    stats.errors++;
  }
}

/**
 * Main execution function
 */
async function main() {
  // Ensure content directory exists
  if (!fs.existsSync(contentPath)) {
    console.error(`Error: Content directory does not exist: ${contentPath}`);
    process.exit(1);
  }
  
  // Get source files from English directory
  const enDir = path.join(contentPath, 'en');
  if (!fs.existsSync(enDir)) {
    console.error(`Error: English source directory does not exist: ${enDir}`);
    process.exit(1);
  }
  
  const sourceFiles = fs.readdirSync(enDir).filter(file => file.endsWith('.md'));
  
  // Get target locales
  let targetLocales;
  if (options.locales) {
    targetLocales = options.locales.split(',').map(l => l.trim());
  } else {
    // Get all locale directories except 'en'
    targetLocales = fs.readdirSync(contentPath)
      .filter(dir => {
        const fullPath = path.join(contentPath, dir);
        return fs.statSync(fullPath).isDirectory() && dir !== 'en';
      });
  }
  
  console.log(`Processing ${sourceFiles.length} files for ${targetLocales.length} locales`);
  console.log(`Options: ${options.dryRun ? 'DRY RUN' : 'LIVE'}, ` +
              `Translation: ${options.translate ? 'ENABLED' : 'DISABLED'}, ` +
              `Skip existing: ${options.skipExisting ? 'YES' : 'NO'}`);
  console.log('');
  
  // Process each file for each locale
  for (const locale of targetLocales) {
    console.log(`\nProcessing locale: ${locale}`);
    console.log('-'.repeat(40));
    
    for (const file of sourceFiles) {
      await processFile(file, locale);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`  Files processed: ${stats.processed}`);
  console.log(`  Files synced: ${stats.synced}`);
  console.log(`  Files created: ${stats.created}`);
  console.log(`  Files skipped: ${stats.skipped}`);
  if (options.translate) {
    console.log(`  Fields translated: ${stats.translated}`);
  }
  if (stats.errors > 0) {
    console.log(`  Errors: ${stats.errors}`);
  }
  
  if (options.dryRun) {
    console.log('\nThis was a dry run. No files were modified.');
    console.log('Run without --dry-run to apply these changes.');
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});