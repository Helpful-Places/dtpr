# DTPR Scripts

This directory contains utility scripts for maintaining the DTPR content and infrastructure.

## Available Scripts

### translate-content.js

Translates content between locales using the Google Translate API.

**Usage:**
```bash
# Basic usage
node translate-content.js --target <locale> --key-file <path-to-key-file>

# Only translate missing fields
node translate-content.js --target <locale> --key-file <path-to-key-file> --skip-existing
```

**Options:**
- `-s, --source <locale>`: Source locale (default: 'en')
- `-t, --target <locale>`: Target locale (required)
- `-f, --fields <fields>`: Fields to translate (comma-separated, default: 'name,description')
- `-k, --key-file <path>`: Path to Google service account key file (required)
- `-c, --content-dir <dir>`: Content directory (default: 'content/dtpr.v1/elements')
- `--skip-existing`: Skip translation of fields that already exist in target file

### translate-content-deepl.js

Translates content between locales using the DeepL API. This is an alternative to the Google Translate script that offers higher quality translations.

**Usage:**
```bash
# Using paid API
node translate-content-deepl.js --target <locale> --api-key <your-api-key>

# Using free tier API
node translate-content-deepl.js --target <locale> --api-key <your-api-key> --free-tier

# Only translate missing fields
node translate-content-deepl.js --target <locale> --api-key <your-api-key> --skip-existing
```

**Options:**
- `-s, --source <locale>`: Source locale (default: 'en')
- `-t, --target <locale>`: Target locale (required)
- `-f, --fields <fields>`: Fields to translate (comma-separated, default: 'name,description')
- `-k, --api-key <key>`: DeepL API key (required)
- `-c, --content-dir <dir>`: Content directory (default: 'content/dtpr.v1/elements')
- `--free-tier`: Use DeepL free tier API endpoint
- `--skip-existing`: Skip translation of fields that already exist in target file

**Notes:**
- DeepL does not support all languages. The script will map unsupported languages (km, tl) to a fallback language (Japanese).
- The free tier has rate limits (500 requests per second). The script automatically adds delays and retries to handle rate limiting.
- For large translation jobs on the free tier, the script may take longer due to rate limiting.

### sync-attributes.js

Syncs shared attributes (id, category, icon by default) across all locale files. The English (en) locale is considered the canonical source of truth. The script can create missing files in non-English locales, copying only the specified attributes from the English files.

**Usage:**
```bash
# Run with default options (dry run)
node scripts/sync-attributes.js --dry-run

# Apply changes
node scripts/sync-attributes.js

# Use with additional options
node scripts/sync-attributes.js --content-dir content/dtpr/elements --attributes id,category,icon,custom_field
```

**Options:**
- `--dry-run`: Show what would be changed without making actual changes
- `--content-dir`: Path to content directory (default: content/dtpr.v1/elements)
- `--attributes`: Comma-separated list of attributes to sync (default: id,category,icon)
- `--create-missing`: Create missing files in non-English locales (enabled by default)
- `--no-create`: Don't create missing files, only update existing ones

### copy-descriptions.js

Copies description attributes from v0 elements to v1 elements, matching by ID and locale.

**Usage:**
```bash
# Run with default options (dry run)
node copy-descriptions.js --dry-run

# Apply changes to all locales
node copy-descriptions.js

# Apply changes to specific locales
node copy-descriptions.js --locales en,fr,es
```

**Options:**
- `--dry-run`: Show what would be changed without making actual changes
- `--locales`: Comma-separated list of locales to process (if not specified, all locales are processed)

### sync-attributes.sh

A wrapper shell script for sync-attributes.js that ensures dependencies are installed before running the JavaScript script.

**Usage:**
```bash
./sync-attributes.sh [OPTIONS]
```

Accepts the same options as sync-attributes.js.

### cleanup_markdown_links.js

Interactive utility to clean up markdown links in content files. Allows removing, keeping, or modifying sentences containing links.

**Usage:**
```bash
node cleanup_markdown_links.js
```

The script will prompt for:
1. The locale to process (or all locales)
2. For each detected link, options to keep, remove, or modify

## Setup

1. Install dependencies:
```
cd scripts
pnpm install
```

2. For Google translation script, set up a Google Cloud project with Translation API access:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Cloud Translation API
   - Create a service account with the "Cloud Translation API User" role
   - Create and download a service account key (JSON format)

3. For DeepL translation script, obtain a DeepL API key:
   - Sign up for a DeepL API account at https://www.deepl.com/pro#developer
   - Choose either the free tier (500,000 characters/month) or a paid plan
   - After logging in, find your API key at https://www.deepl.com/your-account/keys