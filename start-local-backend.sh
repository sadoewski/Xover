#!/bin/bash
# start-local-backend.sh
# Запускает локальный backend для тестирования

set -e

echo "🚀 Запуск локального Xover backend..."
echo ""

# Проверка что мы в правильной директории
if [ ! -d "backend" ]; then
    echo "❌ Ошибка: запустите скрипт из корня проекта xover"
    echo "   cd /Users/sadoewski/projects/xover"
    exit 1
fi

# Проверка что Node.js установлен
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js и попробуйте снова."
    exit 1
fi

# Проверка что зависимости установлены
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Устанавливаю зависимости..."
    cd backend
    npm install
    cd ..
fi

# Проверка что порт 5001 свободен
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Порт 5001 уже занят"
    echo ""
    read -p "Убить процесс на порту 5001? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:5001 | xargs kill -9
        echo "✅ Процесс остановлен"
    else
        echo "❌ Отменено"
        exit 1
    fi
fi

# Проверка БД
if [ ! -f "backend/database.sqlite" ]; then
    echo "🗄️  База данных не найдена. Создаю..."
    cd backend
    npm run db:migrate
    cd ..
    echo "✅ База данных создана"
fi

echo ""
echo "✅ Все готово!"
echo ""
echo "📍 Backend будет доступен на: http://localhost:5001"
echo ""
echo "📝 Настройка macOS приложения:"
echo "   1. Откройте Xover"
echo "   2. Settings (⌘,) → Server"
echo "   3. Server URL: http://localhost:5001"
echo "   4. Save и перезапустите приложение"
echo ""
echo "🛑 Для остановки: Ctrl+C"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Запуск backend
cd backend
npm run dev
