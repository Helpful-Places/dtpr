#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const matter = require('gray-matter');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Regular expression to match markdown links
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

// Function to extract sentences with links
function getSentencesWithLinks(text) {
  if (!text) return [];
  
  // Split by sentence endings (.!?) followed by space or newline
  // Use a regex that accounts for common abbreviations
  const sentences = text.split(/(?<=[.!?])(?:\s+|$)(?![a-z]|[A-Z]\.)/);
  
  return sentences.filter(sentence => linkRegex.test(sentence));
}

// Prompt the user for what to do with a sentence containing links
function promptUserForSentence(sentence, callback) {
  console.log('\nFound sentence with link(s):');
  console.log('-----------------------------');
  console.log(sentence);
  console.log('-----------------------------');
  
  rl.question('Options:\n1. Keep as is\n2. Remove entire sentence\n3. Keep sentence but remove links\n4. Manually rewrite\nYour choice (1-4): ', (answer) => {
    switch(answer.trim()) {
      case '1':
        callback(sentence);
        break;
      case '2':
        callback('');
        break;
      case '3':
        // Replace [text](url) with just text
        const withoutLinks = sentence.replace(linkRegex, '$1');
        callback(withoutLinks);
        break;
      case '4':
        rl.question('Enter your rewrite: ', (rewrite) => {
          callback(rewrite);
        });
        break;
      default:
        console.log('Invalid choice, keeping as is.');
        callback(sentence);
    }
  });
}

// Process all sentences with links in a file
async function processFile(filePath) {
  console.log(`\nProcessing: ${filePath}`);
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err}`);
    return;
  }
  
  // Parse frontmatter with gray-matter
  let data;
  try {
    data = matter(content);
  } catch (err) {
    console.error(`Error parsing frontmatter in ${filePath}: ${err}`);
    return;
  }
  
  if (!data.data.description) {
    console.log(`No description found in ${filePath}`);
    return;
  }
  
  const description = data.data.description;
  
  // Check if there are any links in the description
  const sentencesWithLinks = getSentencesWithLinks(description);
  
  if (sentencesWithLinks.length === 0) {
    console.log(`No links found in description of ${filePath}`);
    return;
  }
  
  console.log(`Found ${sentencesWithLinks.length} sentence(s) with links`);
  
  // Process each sentence
  let updatedDescription = description;
  
  for (const sentence of sentencesWithLinks) {
    // Wrap in a promise to handle the async readline
    await new Promise(resolve => {
      promptUserForSentence(sentence, (newSentence) => {
        if (newSentence === '') {
          // Remove entire sentence while preserving whitespace pattern
          updatedDescription = updatedDescription.replace(sentence, '').replace(/\s+/g, ' ').trim();
        } else if (sentence !== newSentence) {
          // Replace sentence with new version, being careful with regex
          // Escape special regex characters in the sentence
          const escapedSentence = sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          updatedDescription = updatedDescription.replace(new RegExp(escapedSentence, 'g'), newSentence);
        }
        resolve();
      });
    });
  }
  
  // Update frontmatter description
  data.data.description = updatedDescription;
  
  // Create updated content using matter.stringify
  // which uses js-yaml internally for proper YAML formatting
  const updatedContent = matter.stringify(data.content, data.data);
  
  // Write back to file
  try {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  } catch (err) {
    console.error(`Error writing file ${filePath}: ${err}`);
  }
}

// Recursively find all markdown files
function findMarkdownFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findMarkdownFiles(filePath));
    } else if (path.extname(file) === '.md') {
      results.push(filePath);
    }
  }
  
  return results;
}

// Ask for locale before starting
function promptForLocale() {
  return new Promise((resolve) => {
    rl.question('Enter locale to process (e.g., "en", "fr", "es", or press Enter for all): ', (answer) => {
      const locale = answer.trim();
      resolve(locale);
    });
  });
}

// Main function
async function main() {
  try {
    // Prompt for locale
    const locale = await promptForLocale();
    
    // Determine the directory to search
    const baseDir = path.join(process.cwd(), 'content/dtpr/elements');
    let rootDir;
    
    if (locale) {
      rootDir = path.join(baseDir, locale);
      if (!fs.existsSync(rootDir)) {
        console.error(`Locale directory "${rootDir}" does not exist.`);
        return;
      }
    } else {
      rootDir = baseDir;
    }
    
    console.log(`Searching for .md files in ${rootDir}...`);
    const files = findMarkdownFiles(rootDir);
    console.log(`Found ${files.length} markdown files.`);
    
    for (const file of files) {
      await processFile(file);
    }
    
    console.log('\nAll files processed successfully!');
  } catch (err) {
    console.error(`Error: ${err}`);
  } finally {
    rl.close();
  }
}

// Run the script
main();