#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const deepl = require('deepl-node');
const { program } = require('commander');

// Get the correct base paths regardless of where the script is run from
// Find the project root (parent directory of scripts)
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');  // Go up one level from scripts dir to project root

program
  .name('translate-content-deepl')
  .description('Translate content between locales using DeepL API')
  .option('-s, --source <locale>', 'Source locale', 'en')
  .option('-t, --target <locale>', 'Target locale')
  .option('-f, --fields <fields>', 'Fields to translate (comma-separated)', 'name,description')
  .option('-k, --api-key <key>', 'DeepL API key')
  .option('-c, --content-dir <dir>', 'Content directory', path.resolve(projectRoot, 'content/dtpr.v1/elements'))
  .option('--free-tier', 'Use DeepL free tier API endpoint')
  .option('--skip-existing', 'Skip translation of fields that already exist in target file')
  .requiredOption('-t, --target <locale>', 'Target locale is required')
  .requiredOption('-k, --api-key <key>', 'DeepL API key is required')
  .parse(process.argv);

const options = program.opts();

const sourceLocale = options.source;
const targetLocale = options.target;
const fieldsToTranslate = options.fields.split(',');
const apiKey = options.apiKey;
const contentDir = options.contentDir;
const isFreeTier = options.freeTier;
const skipExisting = options.skipExisting;

// Initialize DeepL translator
const translator = new deepl.Translator(apiKey, {
  serverUrl: isFreeTier ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
});

// Language code mapping for DeepL (some codes differ from our locale codes)
const languageCodeMap = {
  'en': 'en-US',
  'es': 'es',
  'fr': 'fr',
  'km': 'ja', // Khmer not supported by DeepL, fallback to Japanese
  'pt': 'pt-BR',
  'tl': 'ja'  // Tagalog not supported by DeepL, fallback to Japanese
};

function getDeepLLanguageCode(locale) {
  return languageCodeMap[locale] || locale;
}

// Add delay between requests to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateText(text, targetLang, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Add delay to avoid rate limiting (500ms for free tier)
      if (isFreeTier && i === 0) {
        await delay(500);
      }
      
      const result = await translator.translateText(text, null, getDeepLLanguageCode(targetLang));
      return result.text;
    } catch (error) {
      console.error('Translation error:', error.message || error);
      
      // Handle specific DeepL errors
      if (error.message && error.message.includes('Language')) {
        console.error(`Language not supported: ${targetLang}. Please check DeepL's supported languages.`);
        return null;
      }
      
      // Handle rate limiting
      if (error.message && error.message.includes('Too many requests')) {
        console.log(`Rate limited. Waiting ${(i + 1) * 2} seconds before retry...`);
        await delay((i + 1) * 2000);
        continue;
      }
      
      // If it's the last retry, return null
      if (i === retries - 1) {
        return null;
      }
    }
  }
  return null;
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
  try {
    // Validate API key by checking usage
    await translator.getUsage();
    console.log('DeepL API key validated successfully');
  } catch (error) {
    console.error('Invalid DeepL API key or connection error:', error);
    process.exit(1);
  }

  // Check if target language is supported
  const targetLangCode = getDeepLLanguageCode(targetLocale);
  if (targetLangCode === 'ja' && !['km', 'tl'].includes(targetLocale)) {
    console.warn(`Warning: Language ${targetLocale} may not be directly supported by DeepL. Using ${targetLangCode} as fallback.`);
  }

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