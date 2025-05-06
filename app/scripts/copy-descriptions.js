#!/usr/bin/env node

/**
 * Copy descriptions from DTPR v0 elements to v1 elements
 * 
 * This script copies the description attribute from v0 markdown files to v1 files
 * matching by ID and locale. It preserves all other content in the target files.
 * 
 * Usage:
 *   node copy-descriptions.js [--dry-run] [--locales <locales>]
 * 
 * Options:
 *   --dry-run     Show what would be changed without making actual changes
 *   --locales     Comma-separated list of locales to process (default: all locales)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  locales: null,
};

// Parse locales option
const localesIndex = args.indexOf('--locales');
if (localesIndex !== -1 && args[localesIndex + 1]) {
  options.locales = args[localesIndex + 1].split(',');
}

// Get the correct base paths regardless of where the script is run from
// Find the project root (parent directory of scripts)
const scriptDir = __dirname;
const basePath = path.resolve(scriptDir, '..');  // Go up one level from scripts dir to project root

// Set up content paths relative to project root
const v0Path = path.join(basePath, 'content/dtpr.v0/elements');
const v1Path = path.join(basePath, 'content/dtpr.v1/elements');

// Ensure the content directories exist
if (!fs.existsSync(v0Path)) {
  console.error(`Error: v0 content directory does not exist: ${v0Path}`);
  process.exit(1);
}

if (!fs.existsSync(v1Path)) {
  console.error(`Error: v1 content directory does not exist: ${v1Path}`);
  process.exit(1);
}

// Get all available locales if not specified
let locales = options.locales;
if (!locales) {
  locales = fs.readdirSync(v0Path).filter(file => {
    return fs.statSync(path.join(v0Path, file)).isDirectory();
  });
}

// Counts for summary
let stats = {
  processed: 0,
  updated: 0,
  missing: 0,
  skipped: 0,
  noDescription: 0
};

// Process each locale
locales.forEach(locale => {
  console.log(`\nProcessing locale: ${locale}`);
  
  const localePath = path.join(v0Path, locale);
  
  if (!fs.existsSync(localePath)) {
    console.warn(`Warning: Locale directory does not exist in v0: ${localePath}`);
    return;
  }
  
  // Get all v0 files for this locale
  const v0Files = glob.sync('*.md', { cwd: localePath });
  
  // Process each v0 file
  v0Files.forEach(file => {
    const v0FilePath = path.join(localePath, file);
    const v0FileContent = fs.readFileSync(v0FilePath, 'utf8');
    let v0Data;
    
    try {
      // Read source file
      v0Data = matter(v0FileContent);
    } catch (error) {
      console.error(`Error parsing front matter in ${v0FilePath}: ${error.message}`);
      return;
    }
    
    // Extract the file ID from the filename (e.g. 'access__available_for_resale.md' -> 'access__available_for_resale')
    const fileId = path.basename(file, '.md');
    
    // Check if the description attribute exists in the v0 file
    if (!v0Data.data.description) {
      console.warn(`Warning: No description found in ${v0FilePath}`);
      stats.noDescription++;
      return;
    }
    
    // Check if the corresponding v1 file exists
    const v1FilePath = path.join(v1Path, locale, file);
    
    if (!fs.existsSync(v1FilePath)) {
      console.warn(`Warning: No matching v1 file found: ${v1FilePath}`);
      stats.missing++;
      return;
    }
    
    // Read the v1 file
    const v1FileContent = fs.readFileSync(v1FilePath, 'utf8');
    let v1Data;
    
    try {
      v1Data = matter(v1FileContent);
    } catch (error) {
      console.error(`Error parsing front matter in ${v1FilePath}: ${error.message}`);
      return;
    }
    
    stats.processed++;
    
    // Compare descriptions
    if (v1Data.data.description === v0Data.data.description) {
      console.log(`Skipping ${locale}/${file} - descriptions are identical`);
      stats.skipped++;
      return;
    }
    
    // Update the v1 file with the v0 description
    console.log(`Updating ${locale}/${file}`);
    console.log(`  Description: "${v0Data.data.description}"`);
    
    // Update the frontmatter
    v1Data.data.description = v0Data.data.description;
    
    // Generate updated content using matter.stringify
    // This will use js-yaml for proper YAML formatting
    const updatedContent = matter.stringify(v1Data.content, v1Data.data);
    
    // Write back to file if not in dry run mode
    if (!options.dryRun) {
      fs.writeFileSync(v1FilePath, updatedContent);
    }
    
    stats.updated++;
  });
});

// Print summary
console.log('\nSummary:');
console.log(`  Files processed: ${stats.processed}`);
console.log(`  Files updated: ${stats.updated}`);
console.log(`  Files missing in v1: ${stats.missing}`);
console.log(`  Files skipped (identical): ${stats.skipped}`);
console.log(`  Files without description in v0: ${stats.noDescription}`);

if (options.dryRun) {
  console.log('\nThis was a dry run. No files were modified.');
  console.log('Run without --dry-run to apply these changes.');
}