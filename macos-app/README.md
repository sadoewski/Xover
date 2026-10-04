# Xover macOS Desktop App

Нативное macOS приложение для Hostprint с встроенным backend и offline sync.

## 🏗️ Архитектура

```
Xover.app (SwiftUI + WebKit)
  ├─ SwiftUI оболочка (нативное macOS UI)
  ├─ WKWebView (загружает React frontend)
  ├─ Встроенный Node.js backend (автостарт)
  └─ SQLite база данных (локальная)
```

## ✨ Возможности

- **Гибридный режим**: Работает локально + синхронизация с облаком
- **Standalone режим**: 100% автономная работа без интернета
- **Offline-first**: Все операции работают офлайн, синхронизируются при подключении
- **Нативный UI**: SwiftUI меню, настройки, горячие клавиши
- **Apple Silicon**: Оптимизировано для M1/M2/M3 Mac

## 📋 Требования

- macOS 13.0+ (Ventura или новее)
- Xcode 15.0+
- Node.js 20+ (для разработки)
- Apple Developer Account (для подписи)

## 🚀 Быстрый старт

### 1. Разработка (без Xcode проекта)

```bash
# Запустить backend локально
cd backend
DB_TYPE=sqlite npm run db:migrate
DB_TYPE=sqlite npm start

# В другом терминале - frontend
cd frontend
npm run dev
```

Откроется браузер с приложением.

### 2. Сборка macOS приложения

**Шаг 1: Создать Xcode проект**

```bash
cd macos-app
open -a Xcode
```

1. File → New → Project
2. macOS → App
3. Product Name: `Xover`
4. Interface: SwiftUI
5. Language: Swift
6. Bundle Identifier: `com.xover.desktop`

**Шаг 2: Добавить файлы**

Перетащите все файлы из `macos-app/Xover/` в Xcode проект:
- XoverApp.swift
- AppDelegate.swift  
- ContentView.swift
- BackendManager.swift
- SyncManager.swift
- WebViewBridge.swift
- MenuCommands.swift
- PreferencesView.swift
- Info.plist
- Entitlements.plist

**Шаг 3: Настроить проект**

1. Signing & Capabilities:
   - Team: Ваш Apple Developer Team
   - Signing Certificate: Developer ID Application
   
2. Build Settings:
   - Minimum Deployment Target: macOS 13.0
   - Architectures: arm64 (Apple Silicon)

3. Entitlements (уже в файле):
   - Network Client/Server
   - File Access (user-selected)
   - Allow Unsigned Executable Memory (для Node.js JIT)

**Шаг 4: Собрать и запустить**

```bash
# Запустить build скрипт
./scripts/build-app.sh

# Или в Xcode: Product → Build (⌘B)
# Product → Run (⌘R)
```

## 📦 Структура проекта

```
macos-app/
├── Xover/                    # Swift исходники
│   ├── XoverApp.swift        # Главное приложение
│   ├── AppDelegate.swift     # Запуск backend
│   ├── ContentView.swift     # Главное окно с WKWebView
│   ├── BackendManager.swift  # Управление Node.js процессом
│   ├── SyncManager.swift     # Офлайн синхронизация
│   ├── WebViewBridge.swift   # Swift ↔ JS bridge
│   ├── MenuCommands.swift    # Нативное меню
│   ├── PreferencesView.swift # Окно настроек
│   └── *.entitlements        # Permissions
│
├── scripts/
│   ├── bundle-backend.sh     # Упаковка Node.js + frontend
│   ├── build-app.sh          # Полная сборка .app
│   └── dev.sh                # Development mode
│
└── Resources/                # Создается при сборке
    ├── node-runtime/         # Node.js binary (arm64)
    ├── backend/              # Backend + node_modules
    └── frontend/             # React build

backend/
├── src/
│   ├── config/
│   │   ├── database-adapter.js    # Переключение SQLite/PostgreSQL
│   │   ├── database-sqlite.js     # SQLite wrapper
│   │   └── database-postgresql.js # PostgreSQL connection
│   │
│   ├── sync/                 # Система синхронизации
│   │   ├── queue.js          # Очередь операций
│   │   ├── processor.js      # Обработка очереди
│   │   ├── puller.js         # Получение изменений с сервера
│   │   └── middleware.js     # Автоматическое добавление в очередь
│   │
│   ├── routes/sync.js        # API endpoints для sync
│   └── controllers/syncController.js
│
└── migrations-sqlite/        # SQLite миграции (7 файлов)
```

## 🎯 Режимы работы

### 1. Hybrid Mode (по умолчанию)
- Работает локально с SQLite
- Синхронизируется с облачным PostgreSQL
- Доступ к данным с любого устройства

### 2. Standalone Mode
- 100% автономная работа
- Только локальная SQLite база
- Без облачной синхронизации
- Включается в: **Preferences → Backend → Standalone Mode**

### 3. Offline Mode
- Временно без интернета
- Операции добавляются в очередь
- Автоматическая синхронизация при подключении

## 🔄 Как работает синхронизация

1. **Локальные операции** → SQLite + очередь sync
2. **Когда есть интернет** → `POST /api/sync/push` (отправка)
3. **Периодический pull** → `POST /api/sync/pull` (получение)
4. **Конфликты** → Last-write-wins по timestamp

## 🛠️ Разработка

### Запуск в dev режиме

```bash
# Backend с SQLite
cd backend
DB_TYPE=sqlite npm run db:migrate
DB_TYPE=sqlite npm start

# Frontend hot-reload
cd frontend  
npm run dev

# Xcode для Swift изменений
open macos-app/Xover.xcodeproj
```

### Тестирование синхронизации

```bash
# Запустить тесты
cd backend
npm test tests/integration/sync.test.js
```

### Переключение между SQLite и PostgreSQL

```bash
# Локально (SQLite)
export DB_TYPE=sqlite
npm start

# Облако (PostgreSQL)
export DB_TYPE=postgresql  
export DATABASE_URL=postgresql://user:pass@host:5432/db
npm start
```

## 📱 Горячие клавиши

- `⌘N` - Новая задача
- `⌘R` - Обновить страницу
- `⌘,` - Настройки
- `⌘Q` - Выход
- `⌘1-5` - Переключение разделов
- `⌘⇧R` - Перезагрузить backend

## 🔐 Подпись и распространение

### Code Signing

```bash
# Подписать приложение
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAMID)" \
  --options runtime \
  Xover.app

# Проверить подпись
codesign --verify --verbose Xover.app
spctl --assess --verbose Xover.app
```

### Notarization (для распространения)

```bash
# Создать архив
ditto -c -k --keepParent Xover.app Xover.zip

# Отправить на нотаризацию
xcrun notarytool submit Xover.zip \
  --apple-id your@email.com \
  --team-id TEAMID \
  --wait

# Прикрепить ticket
xcrun stapler staple Xover.app
```

### Создание DMG

```bash
./scripts/build-app.sh --dmg
```

## 🐛 Troubleshooting

### Backend не запускается

```bash
# Проверить логи
tail -f ~/Library/Logs/Xover/backend.log

# Проверить порт
lsof -i :5000
```

### WKWebView пустой

1. Проверить что backend запущен: http://localhost:5000
2. Проверить Network entitlements в Xcode
3. Очистить WebKit кэш: `~/Library/WebKit/`

### SQLite ошибки

```bash
# Пересоздать базу
rm -rf ~/Library/Application\ Support/com.xover.desktop/
# Перезапустить приложение - миграции применятся автоматически
```

### Синхронизация не работает

1. Проверить сетевое подключение
2. Настройки → Backend → проверить Server URL
3. Проверить логи: `~/Library/Logs/Xover/sync.log`

## 📚 Дополнительно

- **SETUP.md** - Детальная пошаговая инструкция
- **STANDALONE_MODE.md** - Руководство по автономному режиму
- **backend/DATABASE.md** - Документация по БД
- **backend/docs/sync-api.md** - API документация

## 📄 Лицензия

Copyright © 2024 Xover Team

---

**Разработано с использованием:**
- SwiftUI (Apple)
- WKWebView (WebKit)
- Node.js 20
- React + Vite
- SQLite / PostgreSQL
- Express.js
