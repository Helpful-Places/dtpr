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