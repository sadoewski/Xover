#!/bin/bash
# add_files_to_xcode.sh
# Автоматически добавляет новые Swift файлы в Xcode проект

set -e

PROJECT_DIR="/Users/sadoewski/projects/hostprint/macos-app"
PROJECT_FILE="$PROJECT_DIR/Xover.xcodeproj/project.pbxproj"

echo "🔍 Ищем новые Swift файлы..."

# Находим все Swift файлы
SWIFT_FILES=$(find "$PROJECT_DIR/Xover" -name "*.swift" -type f)

# Подсчитываем файлы
FILE_COUNT=$(echo "$SWIFT_FILES" | wc -l | tr -d ' ')

echo "📝 Найдено $FILE_COUNT Swift файлов"

# Список новых файлов, которые нужно добавить
NEW_FILES=(
    "Views/Auth/LoginView.swift"
    "Views/Dashboard/DashboardView.swift"
    "Views/Tasks/TasksView.swift"
    "Views/Tasks/TaskDetailView.swift"
    "Views/Calendar/CalendarView.swift"
    "Views/Calendar/MonthView.swift"
    "Views/RWPrint/RWPrintView.swift"
    "Views/Terminal/TerminalView.swift"
    "Views/Settings/SettingsView.swift"
    "Views/Settings/PreferencesView.swift"
    "Views/MainWindowView.swift"
    "Views/Sidebar/SidebarView.swift"
    "Models/User.swift"
    "Models/Task.swift"
    "Models/AppState.swift"
    "Services/APIService.swift"
)

echo ""
echo "📋 Файлы для добавления:"
for file in "${NEW_FILES[@]}"; do
    FULL_PATH="$PROJECT_DIR/Xover/$file"
    if [ -f "$FULL_PATH" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (не найден)"
    fi
done

echo ""
echo "⚠️  Внимание: Этот скрипт только проверяет наличие файлов."
echo "📝 Для добавления файлов в Xcode проект:"
echo ""
echo "1. Откройте Xover.xcodeproj в Xcode"
echo "2. В Project Navigator выберите группу где хотите добавить файлы"
echo "3. Нажмите File > Add Files to 'Xover'..."
echo "4. Выберите файлы из списка выше"
echo "5. Убедитесь что:"
echo "   - 'Copy items if needed' НЕ выбрано"
echo "   - 'Create groups' выбрано"
echo "   - Target 'Xover' выбран"
echo ""

# Проверяем что все файлы существуют
MISSING_COUNT=0
for file in "${NEW_FILES[@]}"; do
    FULL_PATH="$PROJECT_DIR/Xover/$file"
    if [ ! -f "$FULL_PATH" ]; then
        ((MISSING_COUNT++))
    fi
done

if [ $MISSING_COUNT -eq 0 ]; then
    echo "✅ Все файлы найдены и готовы к добавлению в Xcode!"
else
    echo "❌ Не найдено $MISSING_COUNT файлов"
    exit 1
fi
