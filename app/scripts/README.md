# DTPR Translation Script

This script translates content between locales using the Google Translate API.

## Setup

1. Install dependencies:
```
cd scripts
npm install
```

2. Set up a Google Cloud project and create a service account with access to the Translation API:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Cloud Translation API
   - Create a service account with the "Cloud Translation API User" role
   - Create and download a service account key (JSON format)

## Usage

```
node translate-content.js --target <locale> --key-file <path-to-key-file>
```

### Options

- `-s, --source <locale>`: Source locale (default: 'en')
- `-t, --target <locale>`: Target locale (required)
- `-f, --fields <fields>`: Fields to translate (comma-separated, default: 'name,description')
- `-k, --key-file <path>`: Path to Google service account key file (required)
- `-c, --content-dir <dir>`: Content directory (default: 'content/dtpr/elements')

### Examples

Translate all English content to Khmer:
```
node translate-content.js --source en --target km --key-file path/to/google-key.json
```

Translate only the 'name' field from English to Spanish:
```
node translate-content.js --source en --target es --fields name --key-file path/to/google-key.json
```

## Notes

- The script preserves existing content in target files
- Only the specified frontmatter fields are translated
- New files are created in the target locale directory if they don't exist
# DTPR Scripts

This directory contains utility scripts for maintaining the DTPR content.

## Available Scripts

### sync-attributes.js

Syncs shared attributes (id, category, icon by default) across all locale files. The English (en) locale is considered the canonical source of truth. The script can also create missing files in non-English locales, copying only the specified attributes from the English files, without adding any other attributes like name or description.

**Usage:**
```bash
# Navigate to the project root
cd /path/to/dtpr/app

# Run with default options (dry run)
node scripts/sync-attributes.js --dry-run

# Apply changes
node scripts/sync-attributes.js

# Specify custom content directory
node scripts/sync-attributes.js --content-dir content/dtpr/elements

# Specify custom attributes to sync
node scripts/sync-attributes.js --attributes id,category,icon,custom_field

# Skip creating missing files, only update existing ones
node scripts/sync-attributes.js --no-create
```

**Options:**
- `--dry-run`: Show what would be changed without making actual changes
- `--content-dir`: Path to content directory (default: content/dtpr.v1/elements)
- `--attributes`: Comma-separated list of attributes to sync (default: id,category,icon)
- `--create-missing`: Create missing files in non-English locales (enabled by default)
- `--no-create`: Don't create missing files, only update existing ones

**Dependencies:**
This script requires the following npm packages:
- gray-matter
- glob

Install them with:
```bash
npm install gray-matter glob
```
or
```bash
pnpm add gray-matter glob
```
