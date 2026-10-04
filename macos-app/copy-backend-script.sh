#!/bin/bash

# Build Phase Script: Copy Backend Bundle
# This script copies only essential backend files to the app bundle

set -e

# Determine paths - works both in Xcode and manually
if [ -z "$PROJECT_DIR" ]; then
    # Running manually - use script location
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$SCRIPT_DIR"
fi

if [ -z "$BUILT_PRODUCTS_DIR" ]; then
    # Running manually - use DerivedData
    DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData"
    BUILT_PRODUCTS_DIR=$(find "$DERIVED_DATA" -type d -name "Xover.app" | head -1 | xargs dirname)
    PRODUCT_NAME="Xover"
fi

SOURCE_DIR="${PROJECT_DIR}/backend-bundle"
DEST_DIR="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/Contents/Resources/backend-bundle"

echo "📦 Copying backend bundle..."
echo "   Project: $PROJECT_DIR"
echo "   Source: $SOURCE_DIR"
echo "   Destination: $DEST_DIR"

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: backend-bundle not found at $SOURCE_DIR"
    exit 1
fi

# Create destination
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

# Copy only essential files (excluding duplicates and unnecessary files)
rsync -a --quiet \
  --exclude='node_modules/*/test' \
  --exclude='node_modules/*/tests' \
  --exclude='node_modules/*/examples' \
  --exclude='node_modules/*/example' \
  --exclude='node_modules/*/docs' \
  --exclude='node_modules/*/.github' \
  --exclude='node_modules/*/*.md' \
  --exclude='node_modules/*/README*' \
  --exclude='node_modules/*/readme*' \
  --exclude='node_modules/*/LICENSE*' \
  --exclude='node_modules/*/license*' \
  --exclude='node_modules/*/CHANGELOG*' \
  --exclude='node_modules/*/History.md' \
  --exclude='node_modules/*/.git*' \
  --exclude='node_modules/*/.npm*' \
  --exclude='node_modules/*/.eslint*' \
  --exclude='node_modules/*/.editorconfig' \
  --exclude='node_modules/*/.dockerignore' \
  --exclude='node_modules/*/.nycrc' \
  --exclude='node_modules/*/.travis.yml' \
  --exclude='node_modules/*/*.yml' \
  --exclude='node_modules/*/*.yaml' \
  --exclude='node_modules/*/*.gyp' \
  --exclude='node_modules/*/*.gypi' \
  --exclude='node_modules/*/Dockerfile' \
  --exclude='node_modules/*/Makefile' \
  --exclude='node_modules/*/*.ts' \
  --exclude='node_modules/*/*.d.ts' \
  --exclude='node_modules/*/tsconfig.json' \
  "$SOURCE_DIR/" "$DEST_DIR/"

echo "✅ Backend bundle copied successfully"
