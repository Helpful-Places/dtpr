#!/usr/bin/env node

/**
 * Sync shared attributes (id, category, icon) across all locale files
 * 
 * This script syncs the 'id', 'category', and 'icon' attributes from English 
 * markdown files (canonical locale) to all other locale versions of the same file.
 * If files don't exist in non-English locales, it creates them with the shared attributes.
 * 
 * Usage:
 *   node sync-attributes.js [--dry-run] [--content-dir <path>] [--attributes <attributes>] [--create-missing]
 * 
 * Options:
 *   --dry-run        Show what would be changed without making actual changes
 *   --content-dir    Path to content directory (default: content/dtpr.beta/elements)
 *   --attributes     Comma-separated list of attributes to sync (default: id,category,icon)
 *   --create-missing Create missing files in non-English locales (enabled by default)
 *   --no-create      Don't create missing files, only update existing ones
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  contentDir: 'content/dtpr.beta/elements',
  attributes: ['id', 'category', 'icon'],
  createMissing: !args.includes('--no-create')
};

// Parse content directory option
const contentDirIndex = args.indexOf('--content-dir');
if (contentDirIndex !== -1 && args[contentDirIndex + 1]) {
  options.contentDir = args[contentDirIndex + 1];
}

// Parse attributes option
const attributesIndex = args.indexOf('--attributes');
if (attributesIndex !== -1 && args[attributesIndex + 1]) {
  options.attributes = args[attributesIndex + 1].split(',');
}

// Get the base path (assuming script is run from project root)
const basePath = process.cwd();
const contentPath = path.join(basePath, options.contentDir);

// Ensure the content directory exists
if (!fs.existsSync(contentPath)) {
  console.error(`Error: Content directory does not exist: ${contentPath}`);
  process.exit(1);
}

// Get all locale directories
const localeDirs = fs.readdirSync(contentPath)
  .filter(file => {
    const isDirectory = fs.statSync(path.join(contentPath, file)).isDirectory();
    return isDirectory && file !== 'en'; // Exclude English (source)
  });

// Get all English source files
const enSourceDir = path.join(contentPath, 'en');
if (!fs.existsSync(enSourceDir)) {
  console.error(`Error: English source directory does not exist: ${enSourceDir}`);
  process.exit(1);
}

const enFiles = glob.sync('**/*.md', { cwd: enSourceDir });

// Count for summary
let stats = {
  processed: 0,
  updated: 0,
  missing: 0,
  created: 0,
  unchanged: 0
};

// Process each English file
enFiles.forEach(file => {
  const enFilePath = path.join(enSourceDir, file);
  const enFileContent = fs.readFileSync(enFilePath, 'utf8');
  let enData;
  
  try {
    enData = matter(enFileContent);
  } catch (error) {
    console.error(`Error parsing front matter in ${enFilePath}: ${error.message}`);
    return;
  }

  // Extract the attributes we want to sync from the English file
  const attributesToSync = {};
  options.attributes.forEach(attr => {
    if (enData.data[attr] !== undefined) {
      attributesToSync[attr] = enData.data[attr];
    }
  });

  // Process each locale
  localeDirs.forEach(locale => {
    const localeFilePath = path.join(contentPath, locale, file);
    stats.processed++;

    // Check if the locale file exists
    if (!fs.existsSync(localeFilePath)) {
      stats.missing++;
      
      // If we're not creating missing files, just log and continue
      if (!options.createMissing) {
        console.warn(`Warning: Missing file for locale ${locale}: ${file}`);
        return;
      }
      
      // Create the directory if it doesn't exist
      const localeDir = path.dirname(localeFilePath);
      if (!fs.existsSync(localeDir)) {
        if (!options.dryRun) {
          fs.mkdirSync(localeDir, { recursive: true });
        }
        console.log(`Created directory: ${localeDir}`);
      }
      
      // Create a new file with ONLY the specified shared attributes (id, category, icon by default)
      // Do not add any other attributes like name or description
      const newFileData = attributesToSync;
      
      // Create content similar to the English file but with a placeholder
      const newContent = matter.stringify(
        enData.content.trim() ? `[${locale}] Translation needed` : '',
        newFileData
      );
      
      console.log(`Creating new file for locale ${locale}: ${file}`);
      Object.entries(newFileData).forEach(([attr, value]) => {
        console.log(`  ${attr}: ${JSON.stringify(value)}`);
      });
      
      // Write the new file if not in dry run mode
      if (!options.dryRun) {
        fs.writeFileSync(localeFilePath, newContent);
      }
      
      stats.created++;
      return;
    }

    // Read and parse the locale file
    const localeFileContent = fs.readFileSync(localeFilePath, 'utf8');
    let localeData;
    
    try {
      localeData = matter(localeFileContent);
    } catch (error) {
      console.error(`Error parsing front matter in ${localeFilePath}: ${error.message}`);
      return;
    }

    // Check if we need to update any attributes
    let needsUpdate = false;
    Object.entries(attributesToSync).forEach(([attr, value]) => {
      if (JSON.stringify(localeData.data[attr]) !== JSON.stringify(value)) {
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      // Update the attributes
      Object.entries(attributesToSync).forEach(([attr, value]) => {
        localeData.data[attr] = value;
      });

      // Generate updated content
      const updatedContent = matter.stringify(localeData.content, localeData.data);

      // Display changes
      console.log(`Updating ${locale}/${file}:`);
      Object.entries(attributesToSync).forEach(([attr, value]) => {
        console.log(`  ${attr}: ${JSON.stringify(value)}`);
      });

      // Write back to file if not in dry run mode
      if (!options.dryRun) {
        fs.writeFileSync(localeFilePath, updatedContent);
      }
      
      stats.updated++;
    } else {
      stats.unchanged++;
    }
  });
});

// Print summary
console.log('\nSummary:');
console.log(`  Files processed: ${stats.processed}`);
console.log(`  Files updated: ${stats.updated}`);
console.log(`  Files created: ${stats.created}`);
console.log(`  Files missing: ${stats.missing - stats.created}`);
console.log(`  Files unchanged: ${stats.unchanged}`);

if (options.dryRun) {
  console.log('\nThis was a dry run. No files were modified.');
  console.log('Run without --dry-run to apply these changes.');
}