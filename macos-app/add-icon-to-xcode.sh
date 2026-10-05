#!/bin/bash

echo "📦 Adding AppIcon.icns to Xcode project"
echo "========================================="
echo ""

PROJECT_FILE="Xover.xcodeproj/project.pbxproj"
ICON_FILE="Xover/AppIcon.icns"

# Проверяем что .icns существует
if [ ! -f "$ICON_FILE" ]; then
    echo "❌ $ICON_FILE not found!"
    exit 1
fi

echo "✓ Found: $ICON_FILE"
echo ""

# Проверяем не добавлен ли уже
if grep -q "AppIcon.icns" "$PROJECT_FILE"; then
    echo "✓ AppIcon.icns already in project"
else
    echo "⚠️  AppIcon.icns not in project"
    echo ""
    echo "Manual steps needed:"
    echo "1. Open Xover.xcodeproj in Xcode"
    echo "2. Drag Xover/AppIcon.icns into Project Navigator"
    echo "3. Check 'Copy items if needed' and 'Add to target: Xover'"
    echo "4. Build and run (Cmd+B, Cmd+R)"
    echo ""
    exit 0
fi

echo ""
echo "================================"
echo "Next steps:"
echo "  1. Open project in Xcode"
echo "  2. Clean (Cmd+Shift+K)"
echo "  3. Build (Cmd+B)"
echo "  4. Run (Cmd+R)"
echo "================================"
