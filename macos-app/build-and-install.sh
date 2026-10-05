#!/bin/bash

echo "🔨 Building and Installing Xover"
echo "=================================="
echo ""

cd /Users/sadoewski/projects/hostprint/macos-app

# 1. Stop running app
echo "⏸️  Stopping running Xover..."
pkill -9 Xover 2>/dev/null || true
sleep 1

# 2. Find the build directory
BUILD_DIR=$(find ~/Library/Developer/Xcode/DerivedData -name "Xover-*" -type d 2>/dev/null | head -1)

if [ -z "$BUILD_DIR" ]; then
    echo "❌ Build directory not found!"
    echo ""
    echo "Please build the app first:"
    echo "  1. Open Xover.xcodeproj"
    echo "  2. Press Cmd+B to build"
    echo "  3. Run this script again"
    exit 1
fi

echo "✓ Found build directory: $BUILD_DIR"

# 3. Find the built app
APP_PATH=$(find "$BUILD_DIR/Build/Products" -name "Xover.app" -type d 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ Built app not found!"
    echo ""
    echo "Please build the app first:"
    echo "  1. Open Xover.xcodeproj"
    echo "  2. Press Cmd+B to build"
    echo "  3. Run this script again"
    exit 1
fi

echo "✓ Found built app: $APP_PATH"

# 4. Verify ATS settings
echo ""
echo "🔍 Checking App Transport Security settings..."
if grep -q "NSAppTransportSecurity" "$APP_PATH/Contents/Info.plist"; then
    echo "✓ ATS settings present (HTTP connections allowed)"
else
    echo "❌ ATS settings missing!"
    echo ""
    echo "The build is outdated. Please:"
    echo "  1. Open Xover.xcodeproj"
    echo "  2. Clean Build Folder (Cmd+Shift+K)"
    echo "  3. Build (Cmd+B)"
    echo "  4. Run this script again"
    exit 1
fi

# 5. Check icon
if [ -f "$APP_PATH/Contents/Resources/AppIcon.icns" ]; then
    echo "✓ AppIcon.icns present"
else
    echo "⚠️  AppIcon.icns not found (will use default)"
fi

# 6. Remove old version
echo ""
echo "🗑️  Removing old version from /Applications..."
if [ -d "/Applications/Xover.app" ]; then
    rm -rf /Applications/Xover.app
    echo "✓ Old version removed"
else
    echo "✓ No old version found"
fi

# 7. Copy new version
echo ""
echo "📦 Installing new version..."
cp -R "$APP_PATH" /Applications/
echo "✓ Installed to /Applications/Xover.app"

# 8. Clear icon cache
echo ""
echo "🎨 Refreshing icon cache..."
sudo rm -rf /Library/Caches/com.apple.iconservices.store 2>/dev/null || true
rm -rf ~/Library/Caches/com.apple.iconservices 2>/dev/null || true
killall Dock 2>/dev/null || true

echo ""
echo "=================================="
echo "✅ Installation complete!"
echo ""
echo "Xover is now installed in /Applications"
echo ""
echo "To launch:"
echo "  • Open from Applications folder"
echo "  • Or run: open -a Xover"
echo "  • Or press Cmd+Space and type 'Xover'"
echo ""
echo "Settings:"
echo "  • Server: http://179.255.187.191:3000"
echo "  • HTTP connections: allowed"
echo "  • Backend auto-start: disabled"
echo "=================================="
