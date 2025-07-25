#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { Translate } = require('@google-cloud/translate').v2;
const { program } = require('commander');

// Get the correct base paths regardless of where the script is run from
// Find the project root (parent directory of scripts)
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');  // Go up one level from scripts dir to project root

program
  .name('translate-content')
  .description('Translate content between locales using Google Translate API')
  .option('-s, --source <locale>', 'Source locale', 'en')
  .option('-t, --target <locale>', 'Target locale')
  .option('-f, --fields <fields>', 'Fields to translate (comma-separated)', 'name,description')
  .option('-k, --key-file <path>', 'Path to Google service account key file')
  .option('-c, --content-dir <dir>', 'Content directory', path.resolve(projectRoot, 'content/dtpr.v1/elements'))
  .option('--skip-existing', 'Skip translation of fields that already exist in target file')
  .requiredOption('-t, --target <locale>', 'Target locale is required')
  .requiredOption('-k, --key-file <path>', 'Path to Google service account key file is required')
  .parse(process.argv);

const options = program.opts();

const sourceLocale = options.source;
const targetLocale = options.target;
const fieldsToTranslate = options.fields.split(',');
const keyFilePath = options.keyFile;
const contentDir = options.contentDir;
const skipExisting = options.skipExisting;

// Initialize Google Translate client
const translate = new Translate({
  keyFilename: keyFilePath
});

async function translateText(text, targetLang) {
  try {
    const [translation] = await translate.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return null;
  }
}

async function processFile(sourceFilePath, targetFilePath) {
  try {
    // Read source file
    const sourceContent = fs.readFileSync(sourceFilePath, 'utf8');
    const { data: sourceFrontmatter, content: sourceMarkdown } = matter(sourceContent);
    
    // Create target file structure
    let targetFrontmatter;
    let targetMarkdown = sourceMarkdown;
    
    // If target file exists, read it to preserve existing content
    if (fs.existsSync(targetFilePath)) {
      const targetContent = fs.readFileSync(targetFilePath, 'utf8');
      const parsedTarget = matter(targetContent);
      targetFrontmatter = parsedTarget.data;
      targetMarkdown = parsedTarget.content;
    } else {
      targetFrontmatter = { ...sourceFrontmatter };
    }

    // Translate specified frontmatter fields
    let translatedCount = 0;
    let skippedCount = 0;
    
    for (const field of fieldsToTranslate) {
      if (sourceFrontmatter[field]) {
        // Check if we should skip existing fields
        if (skipExisting && targetFrontmatter[field]) {
          console.log(`Skipping ${field} in ${path.basename(sourceFilePath)} (already exists)`);
          skippedCount++;
          continue;
        }
        
        console.log(`Translating ${field} in ${path.basename(sourceFilePath)}`);
        const translatedText = await translateText(sourceFrontmatter[field], targetLocale);
        if (translatedText) {
          targetFrontmatter[field] = translatedText;
          translatedCount++;
        }
      }
    }
    
    // If all fields were skipped, don't write the file
    if (skipExisting && translatedCount === 0 && skippedCount > 0) {
      console.log(`Skipped ${path.basename(sourceFilePath)} - all fields already exist`);
      return;
    }

    // Create the final translated content using matter.stringify
    // which uses js-yaml internally for proper YAML formatting
    const translatedFileContent = matter.stringify(targetMarkdown, targetFrontmatter);
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetFilePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Write the translated file
    fs.writeFileSync(targetFilePath, translatedFileContent);
    console.log(`Successfully translated ${path.basename(sourceFilePath)} to ${targetLocale}`);
  } catch (error) {
    console.error(`Error processing ${sourceFilePath}:`, error);
  }
}

async function main() {
  // Validate locales and paths
  const sourceDir = path.join(contentDir, sourceLocale);
  const targetDir = path.join(contentDir, targetLocale);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source locale directory does not exist: ${sourceDir}`);
    process.exit(1);
  }
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Get all source files
  const sourceFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.md'));
  
  console.log(`Found ${sourceFiles.length} files to translate from ${sourceLocale} to ${targetLocale}`);
  
  // Process each file with progress tracking
  let completed = 0;
  let failed = 0;
  
  for (const file of sourceFiles) {
    const sourceFilePath = path.join(sourceDir, file);
    const targetFilePath = path.join(targetDir, file);
    
    try {
      await processFile(sourceFilePath, targetFilePath);
      completed++;
    } catch (error) {
      console.error(`Failed to process ${file}:`, error.message);
      failed++;
    }
    
    // Show progress every 10 files
    if ((completed + failed) % 10 === 0) {
      console.log(`Progress: ${completed + failed}/${sourceFiles.length} files processed (${failed} failed)`);
    }
  }
  
  console.log(`\nTranslation completed: ${completed} successful, ${failed} failed out of ${sourceFiles.length} total files.`);
}

main().catch(error => {
  console.error('Translation failed:', error);
  process.exit(1);
});