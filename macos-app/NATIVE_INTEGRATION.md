# Xover Native Interface Integration

## Структура приложения

### Models
- `User.swift` - модель пользователя
- `Task.swift` - модель задачи
- `AppState.swift` - состояние приложения

### Views

#### Auth
- `LoginView.swift` - экран входа

#### Dashboard  
- `DashboardView.swift` - главный дашборд

#### Tasks
- `TasksView.swift` - список задач
- `TaskDetailView.swift` - детали задачи

#### Calendar
- `CalendarView.swift` - основной календарь
- `MonthView.swift` - месячный вид календаря

#### RWPrint
- `RWPrintView.swift` - интеграция с печатью

#### Terminal
- `TerminalView.swift` - встроенный терминал

#### Settings
- `SettingsView.swift` - настройки
- `PreferencesView.swift` - окно preferences

#### Common
- `MainWindowView.swift` - главное окно
- `SidebarView.swift` - боковая панель

### Services
- `APIService.swift` - REST API клиент

### Other
- `MenuCommands.swift` - команды меню приложения
- `AppDelegate.swift` - делегат приложения

## Добавление файлов в Xcode

### Автоматически через Xcode
1. Откройте `Xover.xcodeproj` в Xcode
2. Перетащите папки `Views`, `Models` и `Services` в Project Navigator
3. Убедитесь что выбрано "Create groups" и target "Xover"
4. Нажмите Finish

### Вручную
Если файлы не отображаются:
1. В Project Navigator нажмите правой кнопкой на "Xover"
2. Выберите "Add Files to Xover..."
3. Выберите все новые `.swift` файлы
4. Убедитесь что "Copy items if needed" **не** выбрано
5. Target membership должен быть "Xover"

## Обновление Info.plist

Добавьте следующие разрешения если нужно:
```xml
<key>NSLocalNetworkUsageDescription</key>
<string>Xover needs network access to connect to Hostprint backend</string>
```

## Build Settings

Убедитесь что:
- Deployment Target: macOS 13.0+
- Swift Language Version: Swift 5

## Зависимости

Текущие зависимости уже добавлены через SPM:
- None (используем только Foundation и SwiftUI)

## Запуск

1. Соберите проект: `⌘ + B`
2. Запустите: `⌘ + R`

## Тестирование аутентификации

По умолчанию:
- Backend URL: `http://179.255.187.191:3000`
- Используйте существующие учетные данные Hostprint

## Миграция с WebView

Старый `ContentView.swift` с WebView можно удалить или переименовать в `ContentView.swift.backup` после успешного тестирования нативного интерфейса.

## Troubleshooting

### Ошибки компиляции
- Проверьте что все файлы добавлены в target
- Убедитесь что нет дублирующихся определений (например, AppState)

### Ошибки рантайма
- Проверьте логи в Console.app
- Убедитесь что backend доступен
- Проверьте что API endpoints правильные

## Следующие шаги

1. ✅ Базовая структура и модели
2. ✅ Аутентификация
3. ✅ Список задач
4. ✅ Календарь (базовый)
5. ⏳ Детализация календаря (Day/Week/Year views)
6. ⏳ Terminal интеграция
7. ⏳ RWPrint интеграция
8. ⏳ Real-time updates через WebSockets
9. ⏳ Notifications
10. ⏳ Search и фильтры

## Архитектура

```
XoverApp
├── AppDelegate (backend management)
├── AppState (global state + auth)
│
├── LoginView (если не авторизован)
│
└── MainWindowView (если авторизован)
    ├── SidebarView (навигация)
    └── Content Area
        ├── DashboardView
        ├── TasksView
        ├── CalendarView
        ├── RWPrintView
        ├── TerminalView
        └── SettingsView
```

## API Integration

### Authentication
```swift
POST /api/auth/login
{
  "username": "user",
  "password": "pass"
}
Response: { "access_token": "..." }
```

### Tasks
```swift
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id
```

### User Profile
```swift
GET /api/users/me
```

Token хранится в macOS Keychain для безопасности.
