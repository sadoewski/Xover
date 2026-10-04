#!/bin/bash

# Script to bundle backend with Node.js for macOS app
# This creates a standalone backend bundle that can be embedded in .app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
BUNDLE_DIR="$SCRIPT_DIR/backend-bundle"

echo "📦 Bundling backend for macOS app..."

# Clean previous bundle
rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"

# Copy backend files
echo "   Copying backend files..."
rsync -av --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'tests' \
  --exclude 'coverage' \
  --exclude '.env' \
  --exclude 'data' \
  --exclude '*.log' \
  "$BACKEND_DIR/" "$BUNDLE_DIR/"

# Install production dependencies
echo "   Installing production dependencies..."
cd "$BUNDLE_DIR"
npm install --production --omit=dev

# Create .env template
echo "   Creating .env template..."
cat > "$BUNDLE_DIR/.env" << 'EOF'
NODE_ENV=production
PORT=5000
DB_TYPE=sqlite
DB_PATH=./data/hostprint.db
JWT_SECRET=REPLACE_WITH_GENERATED_SECRET
ALLOWED_ORIGINS=http://localhost:5000
EOF

# Create data directory
mkdir -p "$BUNDLE_DIR/data"

# Copy Node.js runtime (if available via nvm or homebrew)
echo "   Copying Node.js runtime..."
NODE_PATH=$(which node)
NODE_DIR="$BUNDLE_DIR/nodejs"
mkdir -p "$NODE_DIR/bin"

if [ -f "$NODE_PATH" ]; then
    # Copy node binary
    cp "$NODE_PATH" "$NODE_DIR/bin/node"
    chmod +x "$NODE_DIR/bin/node"

    # Find and copy libnode dylib
    NODE_LIB_DIR=$(dirname "$NODE_PATH")/../lib
    if [ -d "$NODE_LIB_DIR" ]; then
        mkdir -p "$NODE_DIR/lib"
        find "$NODE_LIB_DIR" -name "libnode*.dylib" -exec cp {} "$NODE_DIR/lib/" \;
        echo "   ✓ Node.js runtime and libraries copied from $NODE_PATH"
    else
        echo "   ⚠️  Warning: Node.js lib directory not found"
        echo "   Node might not work correctly"
    fi
else
    echo "   ⚠️  Node.js not found at $NODE_PATH"
    echo "   Please install Node.js v18+ and rerun this script"
    exit 1
fi

# Make sure the bundle is executable
chmod -R u+rwX,go+rX,go-w "$BUNDLE_DIR"

echo "✓ Backend bundle created at: $BUNDLE_DIR"
echo ""
echo "Next steps:"
echo "1. Add backend-bundle to Xcode project as folder reference"
echo "2. Ensure 'Copy Bundle Resources' includes backend-bundle"
echo "3. Build and run the app"
