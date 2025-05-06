#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
  const sentences = text.split(/(?<=[.!?])\s+/);
  
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
  
  // Parse frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    console.log(`No frontmatter found in ${filePath}`);
    return;
  }
  
  const frontmatter = match[1];
  const descriptionMatch = frontmatter.match(/description:\s*(.*(?:\n\s+.*)*)/);
  
  if (!descriptionMatch) {
    console.log(`No description found in ${filePath}`);
    return;
  }
  
  let description = descriptionMatch[1];
  
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
          // Remove entire sentence
          updatedDescription = updatedDescription.replace(sentence, '');
        } else {
          // Replace sentence with new version
          updatedDescription = updatedDescription.replace(sentence, newSentence);
        }
        resolve();
      });
    });
  }
  
  // Update file content
  const updatedContent = content.replace(
    /description:\s*(.*(?:\n\s+.*)*)/, 
    `description: ${updatedDescription}`
  );
  
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
    const baseDir = path.join(__dirname, 'content/dtpr/elements');
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