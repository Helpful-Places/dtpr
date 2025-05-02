#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to the repo root directory
cd "$REPO_ROOT"

# Check if necessary dependencies are installed
if ! npm list --prefix "$SCRIPT_DIR" gray-matter glob > /dev/null 2>&1; then
  echo "Installing required dependencies..."
  npm install --prefix "$SCRIPT_DIR"
fi

# Show help if requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "DTPR Attributes Sync Tool"
  echo "------------------------"
  echo "Syncs shared attributes across locale files and creates missing files if needed."
  echo ""
  echo "Usage:"
  echo "  $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --dry-run           Show what would be changed without making actual changes"
  echo "  --content-dir PATH  Path to content directory (default: content/dtpr.beta/elements)"
  echo "  --attributes LIST   Comma-separated list of attributes to sync (default: id,category,icon)"
  echo "  --create-missing    Create missing files in non-English locales (enabled by default)"
  echo "  --no-create         Don't create missing files, only update existing ones"
  echo "  -h, --help          Display this help message"
  exit 0
fi

# Execute the Node.js script with all arguments passed to this script
node "$SCRIPT_DIR/sync-attributes.js" "$@"