#!/bin/bash

echo "🔍 Checking Xover App Icon Setup"
echo "=================================="
echo ""

# 1. Проверить наличие иконок
echo "📁 Icon files:"
if [ -d "Assets.xcassets/AppIcon.appiconset" ]; then
    cd Assets.xcassets/AppIcon.appiconset
    COUNT=$(ls -1 *.png 2>/dev/null | wc -l)
    echo "  ✓ Found $COUNT icon files"

    # Проверить размеры
    for size in 16 32 128 256 512; do
        if [ -f "icon_${size}x${size}.png" ]; then
            ACTUAL=$(sips -g pixelWidth "icon_${size}x${size}.png" 2>/dev/null | tail -1 | awk '{print $2}')
            if [ "$ACTUAL" = "$size" ]; then
                echo "  ✓ icon_${size}x${size}.png ($ACTUAL px)"
            else
                echo "  ✗ icon_${size}x${size}.png wrong size ($ACTUAL px)"
            fi
        else
            echo "  ✗ icon_${size}x${size}.png missing"
        fi
    done
    cd ../..
else
    echo "  ✗ AppIcon.appiconset not found!"
fi

echo ""

# 2. Проверить Contents.json
echo "📝 Contents.json:"
if [ -f "Assets.xcassets/AppIcon.appiconset/Contents.json" ]; then
    ENTRIES=$(grep -c '"filename"' Assets.xcassets/AppIcon.appiconset/Contents.json)
    echo "  ✓ Valid ($ENTRIES entries)"
else
    echo "  ✗ Contents.json missing!"
fi

echo ""

# 3. Проверить настройки проекта
echo "⚙️  Project settings:"
if grep -q "ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon" Xover.xcodeproj/project.pbxproj; then
    echo "  ✓ AppIcon name configured"
else
    echo "  ✗ AppIcon name not set!"
fi

if grep -q "Assets.xcassets" Xover.xcodeproj/project.pbxproj; then
    echo "  ✓ Assets.xcassets in project"
else
    echo "  ✗ Assets.xcassets not added!"
fi

echo ""

# 4. Проверить собранное приложение
echo "🔍 Built application:"
BUILT_APP=$(find ~/Library/Developer/Xcode/DerivedData/Xover-*/Build/Products -name "Xover.app" -type d 2>/dev/null | head -1)

if [ -n "$BUILT_APP" ]; then
    echo "  ✓ Found: $BUILT_APP"

    # Проверить есть ли иконки в .app
    if [ -d "$BUILT_APP/Contents/Resources/Assets.car" ] || [ -f "$BUILT_APP/Contents/Resources/Assets.car" ]; then
        echo "  ✓ Assets.car present (icons compiled)"
    else
        echo "  ⚠️  Assets.car not found (rebuild needed)"
    fi

    # Проверить Bundle ID
    BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$BUILT_APP/Contents/Info.plist" 2>/dev/null)
    if [ -n "$BUNDLE_ID" ]; then
        echo "  ✓ Bundle ID: $BUNDLE_ID"
    fi
else
    echo "  ⚠️  No built application found"
    echo "     Build the app first (Cmd+B in Xcode)"
fi

echo ""
echo "=================================="
echo "✅ Icon setup check complete!"
echo ""
echo "Next steps:"
echo "  1. Clean Build (Cmd+Shift+K)"
echo "  2. Build (Cmd+B)"
echo "  3. Run (Cmd+R)"
echo ""
echo "Icon should appear in Dock when running!"
