#!/bin/bash
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MACOS_APP_DIR="$PROJECT_ROOT/macos-app"
XCODE_PROJECT="$MACOS_APP_DIR/Xover/Xover.xcodeproj"
SCHEME="Xover"
CONFIGURATION="Release"
BUILD_DIR="$MACOS_APP_DIR/build"
APP_NAME="Xover.app"
DMG_NAME="Xover-Installer.dmg"

# Code signing identity (set to empty string to skip signing)
SIGNING_IDENTITY="${SIGNING_IDENTITY:-}"

echo "🚀 Building Xover macOS app..."
echo "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Bundle backend and frontend
echo "📦 Step 1: Bundling backend and frontend..."
"$SCRIPT_DIR/bundle-backend.sh"
if [ $? -ne 0 ]; then
    echo "❌ Error: Bundle failed"
    exit 1
fi
echo ""

# Step 2: Build with Xcode
echo "🔨 Step 2: Building with Xcode..."
if [ ! -d "$XCODE_PROJECT" ]; then
    echo "❌ Error: Xcode project not found at $XCODE_PROJECT"
    exit 1
fi

cd "$MACOS_APP_DIR"

# Clean previous build
rm -rf "$BUILD_DIR"

xcodebuild clean \
    -project "$XCODE_PROJECT" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    > /dev/null 2>&1

xcodebuild archive \
    -project "$XCODE_PROJECT" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$BUILD_DIR/$SCHEME.xcarchive" \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO

if [ $? -ne 0 ]; then
    echo "❌ Error: Xcode build failed"
    exit 1
fi

echo "✅ Xcode build successful"
echo ""

# Step 3: Export app
echo "📤 Step 3: Exporting app..."
APP_PATH="$BUILD_DIR/$SCHEME.xcarchive/Products/Applications/$APP_NAME"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: Built app not found at $APP_PATH"
    exit 1
fi

# Copy to build directory
mkdir -p "$BUILD_DIR/Release"
cp -r "$APP_PATH" "$BUILD_DIR/Release/"
echo "✅ App exported to $BUILD_DIR/Release/$APP_NAME"
echo ""

# Step 4: Code signing (optional)
if [ -n "$SIGNING_IDENTITY" ]; then
    echo "✍️  Step 4: Code signing..."
    codesign --force --deep --sign "$SIGNING_IDENTITY" "$BUILD_DIR/Release/$APP_NAME"
    
    if [ $? -ne 0 ]; then
        echo "⚠️  Warning: Code signing failed, continuing without signature"
    else
        echo "✅ App signed with: $SIGNING_IDENTITY"
        
        # Verify signature
        codesign --verify --deep --strict "$BUILD_DIR/Release/$APP_NAME"
        if [ $? -eq 0 ]; then
            echo "✅ Signature verified"
        fi
    fi
    echo ""
else
    echo "ℹ️  Step 4: Skipping code signing (set SIGNING_IDENTITY to enable)"
    echo ""
fi

# Step 5: Create DMG installer
echo "💿 Step 5: Creating DMG installer..."
DMG_PATH="$BUILD_DIR/$DMG_NAME"
DMG_TEMP="$BUILD_DIR/dmg-temp"

rm -f "$DMG_PATH"
rm -rf "$DMG_TEMP"
mkdir -p "$DMG_TEMP"

# Copy app to temp directory
cp -r "$BUILD_DIR/Release/$APP_NAME" "$DMG_TEMP/"

# Create Applications symlink
ln -s /Applications "$DMG_TEMP/Applications"

# Create DMG
hdiutil create -volname "Xover" \
    -srcfolder "$DMG_TEMP" \
    -ov -format UDZO \
    "$DMG_PATH"

if [ $? -ne 0 ]; then
    echo "❌ Error: DMG creation failed"
    exit 1
fi

# Clean up temp
rm -rf "$DMG_TEMP"

echo "✅ DMG created: $DMG_PATH"
echo ""

# Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Build complete!"
echo ""
echo "📦 Outputs:"
echo "   App: $BUILD_DIR/Release/$APP_NAME"
echo "   DMG: $DMG_PATH"
echo ""
echo "📊 Sizes:"
APP_SIZE=$(du -sh "$BUILD_DIR/Release/$APP_NAME" | cut -f1)
DMG_SIZE=$(du -sh "$DMG_PATH" | cut -f1)
echo "   App: $APP_SIZE"
echo "   DMG: $DMG_SIZE"
echo ""
echo "🚀 To install: Open $DMG_NAME and drag Xover to Applications"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
