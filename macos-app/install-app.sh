#!/bin/bash

# Script to build and install Xover.app to /Applications
# Run this after building in Xcode

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Finding Xover.app in DerivedData..."

# Find the latest build
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "Xover.app" -type d 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ Xover.app not found!"
    echo ""
    echo "Please build the project first:"
    echo "  1. Open Xover.xcodeproj in Xcode"
    echo "  2. Press ⌘B to build"
    echo "  3. Run this script again"
    exit 1
fi

echo "✓ Found: $APP_PATH"

# Check if backend-bundle is included
if [ ! -d "$APP_PATH/Contents/Resources/backend-bundle" ]; then
    echo ""
    echo "⚠️  WARNING: backend-bundle not found in app bundle!"
    echo ""
    echo "Please add backend-bundle to Xcode project:"
    echo "  1. Right-click on 'Xover' folder in Xcode"
    echo "  2. Add Files to 'Xover'..."
    echo "  3. Select 'backend-bundle' folder"
    echo "  4. Choose 'Create folder references' (NOT groups)"
    echo "  5. Build again (⌘B)"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ backend-bundle is included"

    # Check Node.js runtime
    if [ -f "$APP_PATH/Contents/Resources/backend-bundle/nodejs/bin/node" ]; then
        NODE_VERSION=$("$APP_PATH/Contents/Resources/backend-bundle/nodejs/bin/node" --version)
        echo "✓ Node.js runtime included: $NODE_VERSION"
    else
        echo "⚠️  Node.js runtime not found in bundle"
    fi
fi

# Remove old version
if [ -d "/Applications/Xover.app" ]; then
    echo ""
    echo "📦 Removing old version..."
    rm -rf "/Applications/Xover.app"
fi

# Copy new version
echo "📦 Installing to /Applications..."
cp -R "$APP_PATH" /Applications/

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 Launch Xover:"
echo "   - Open Finder → Applications → Xover.app"
echo "   - Or run: open /Applications/Xover.app"
echo ""
echo "📊 Database location:"
echo "   ~/Library/Application Support/com.hostprint.Xover/hostprint.db"
echo ""
echo "🌐 Web interface:"
echo "   http://localhost:3001"
echo ""
