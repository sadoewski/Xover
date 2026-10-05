#!/bin/bash

echo "🎨 Refreshing Xover App Icon"
echo "=============================="
echo ""

# 1. Убить приложение если запущено
echo "⏸️  Stopping Xover if running..."
pkill -9 Xover 2>/dev/null || true

# 2. Очистить кэш иконок macOS
echo "🗑️  Clearing icon cache..."
sudo rm -rf /Library/Caches/com.apple.iconservices.store 2>/dev/null || true
rm -rf ~/Library/Caches/com.apple.iconservices 2>/dev/null || true

# 3. Очистить DerivedData
echo "🗑️  Clearing DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/Xover-* 2>/dev/null || true

# 4. Перезапустить Dock и Finder (применяет изменения иконок)
echo "🔄 Restarting Dock and Finder..."
killall Dock
killall Finder

echo ""
echo "✅ Icon cache cleared!"
echo ""
echo "Now in Xcode:"
echo "  1. Clean Build Folder (Cmd+Shift+K)"
echo "  2. Build (Cmd+B)"
echo "  3. Run (Cmd+R)"
echo ""
echo "The app icon should appear in:"
echo "  • Dock (when running)"
echo "  • Applications folder"
echo "  • Cmd+Tab switcher"
echo ""
