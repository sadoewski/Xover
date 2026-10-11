# ✅ Исправления ошибок сборки - Готово

## Что было исправлено

### 1. Дублирующиеся файлы
- ✅ `PreferencesView.swift` → переименован старый в `.backup`
- ✅ `AppState.swift` в Stores → переименован в `.backup`

### 2. Недостающие Notification Names
- ✅ Создан `Utilities/NotificationNames.swift` с централизованными notifications
- ✅ Удалены дубликаты из `MenuCommands.swift`
- ✅ Удалены дубликаты из `WebViewBridge.swift`

## 🔧 Следующие шаги в Xcode

### 1. Добавьте новый файл в проект

В Xcode:
1. **File → Add Files to "Xover"**
2. Выберите: `Xover/Utilities/NotificationNames.swift`
3. Убедитесь:
   - ✅ Target: Xover
   - ❌ Copy items if needed (не нужно)
4. **Add**

### 2. Удалите старые файлы из проекта

В Project Navigator найдите и удалите (если они красные):
- `PreferencesView.swift` (старый, не в папке Views/Settings)
- `Stores/AppState.swift` (если есть)

**Важно**: Выбирайте **"Remove Reference"**, НЕ "Move to Trash"!

### 3. Очистите и пересоберите

```
Product → Clean Build Folder (⇧⌘K)
Product → Build (⌘B)
```

## 📋 Структура файлов после исправлений

```
Xover/
├── XoverApp.swift ✅
├── AppDelegate.swift ✅
├── MenuCommands.swift ✅ (обновлен)
├── ContentView.swift ✅ (старый WebView, пока оставлен)
├── WebViewBridge.swift ✅ (обновлен)
│
├── Models/
│   ├── AppState.swift ✅ (основной)
│   ├── User.swift ✅
│   └── Task.swift ✅
│
├── Services/
│   └── APIService.swift ✅
│
├── Utilities/
│   ├── FeatureFlags.swift ✅
│   └── NotificationNames.swift ✅ NEW!
│
├── Views/
│   ├── MainWindowView.swift ✅
│   ├── Auth/LoginView.swift ✅
│   ├── Dashboard/DashboardView.swift ✅
│   ├── Tasks/TasksView.swift ✅
│   ├── Tasks/TaskDetailView.swift ✅
│   ├── Calendar/CalendarView.swift ✅
│   ├── Calendar/MonthView.swift ✅
│   ├── Sidebar/SidebarView.swift ✅
│   ├── Settings/SettingsView.swift ✅
│   └── Settings/PreferencesView.swift ✅ (новый)
│
└── Stores/
    └── AppState.swift.backup (не в проекте)
```

## 🎯 Проверка

После сборки:
1. Запустите проект (⌘R)
2. Должен открыться экран логина
3. Введите учетные данные
4. Должен открыться нативный интерфейс с sidebar

## ⚠️ Если остались ошибки

Напиши полный текст ошибки из Xcode, включая:
- Файл
- Строку
- Сообщение об ошибке

Я помогу исправить!

## 📝 После успешной сборки

Можешь тестировать с локальным backend:
```bash
cd /Users/sadoewski/projects/hostprint
./start-local-backend.sh
```

В приложении Settings → Server → URL: `http://localhost:5001`
