# Xover macOS App - Native Interface

Нативное macOS приложение для Hostprint с полным SwiftUI интерфейсом.

## 🚀 Быстрый старт

### 1. Добавление файлов в Xcode

Все файлы уже созданы в правильной структуре. Теперь нужно добавить их в Xcode project:

```bash
cd /Users/sadoewski/projects/hostprint/macos-app
open Xover.xcodeproj
```

В Xcode:
1. **File → Add Files to "Xover"...**
2. Выберите следующие папки/файлы:
   - `Xover/Views/` (вся папка с подпапками)
   - `Xover/Models/` (вся папка)
   - `Xover/Services/` (вся папка)
3. В диалоге убедитесь:
   - ✅ **Added folders: Create groups**
   - ✅ **Target: Xover** (checked)
   - ❌ **Copy items if needed** (unchecked)
4. Нажмите **Add**

### 2. Проверка файлов

Убедитесь что следующие файлы присутствуют в Project Navigator:

```
Xover/
├── XoverApp.swift ✅ (обновлен)
├── AppDelegate.swift ✅
├── MenuCommands.swift ✅
│
├── Models/
│   ├── AppState.swift ⭐ NEW
│   ├── User.swift ⭐ NEW
│   └── Task.swift ⭐ NEW
│
├── Services/
│   └── APIService.swift ⭐ NEW
│
└── Views/
    ├── MainWindowView.swift ⭐ NEW
    ├── Sidebar/
    │   └── SidebarView.swift ⭐ NEW
    ├── Auth/
    │   └── LoginView.swift ⭐ NEW
    ├── Dashboard/
    │   └── DashboardView.swift ⭐ NEW
    ├── Tasks/
    │   ├── TasksView.swift ⭐ NEW
    │   └── TaskDetailView.swift ⭐ NEW
    ├── Calendar/
    │   ├── CalendarView.swift ⭐ NEW
    │   └── MonthView.swift ⭐ NEW
    ├── RWPrint/
    │   └── RWPrintView.swift ⭐ NEW
    ├── Terminal/
    │   └── TerminalView.swift ⭐ NEW
    └── Settings/
        ├── SettingsView.swift ⭐ NEW
        └── PreferencesView.swift ⭐ NEW
```

### 3. Сборка и запуск

```bash
# Соберите проект
⌘ + B

# Запустите
⌘ + R
```

## 📱 Функциональность

### Реализовано ✅

- **Аутентификация**
  - Экран входа
  - Token storage в Keychain
  - Auto-login при наличии токена

- **Dashboard**
  - Обзор задач
  - Статистика
  - Быстрые действия

- **Управление задачами**
  - Список задач
  - Создание/редактирование/удаление
  - Фильтрация и поиск
  - Детальный вид задачи

- **Календарь**
  - Месячный вид
  - Навигация по месяцам
  - Отображение задач на календаре

- **Настройки**
  - Конфигурация сервера
  - Внешний вид (Light/Dark/Auto)
  - Уведомления

- **Боковое меню**
  - Навигация между разделами
  - Счетчики задач

### В разработке 🚧

- Calendar Day/Week/Year views
- Terminal integration
- RWPrint integration
- Real-time updates (WebSockets)
- Push notifications
- Advanced search & filters

## 🏗️ Архитектура

### State Management

Используем `@StateObject` для `AppState` который содержит:
- Аутентификацию
- Текущего пользователя
- Список задач
- Конфигурацию

### API Integration

`APIService` - singleton для всех HTTP запросов:
- Automatic token injection
- Error handling
- Type-safe responses

### Data Flow

```
View → AppState → APIService → Backend
  ↓
View updates automatically via @Published
```

## 🔐 Безопасность

- Токены хранятся в **macOS Keychain**
- Все API запросы через HTTPS (production)
- Нет хранения паролей

## 🎨 UI/UX

- **Native macOS design** - SwiftUI
- **Dark mode support** - автоматически
- **Responsive layout** - поддержка разных размеров окон
- **Keyboard shortcuts** - стандартные macOS shortcuts

## 🔧 Конфигурация

### Backend URL

По умолчанию: `http://179.255.187.191:3000`

Изменить в **Settings → Server → Server URL**

### Local Backend

Если хотите использовать локальный backend:

1. Запустите backend локально на порту 5001
2. В Settings установите:
   - Server URL: `http://localhost:5001`
   - Включите "Auto-start local backend"

## 📝 API Endpoints

### Authentication
```
POST /api/auth/login
```

### User
```
GET /api/users/me
```

### Tasks
```
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

## 🐛 Troubleshooting

### Ошибки компиляции

**Problem**: `Cannot find 'AppState' in scope`
**Solution**: Убедитесь что `Models/AppState.swift` добавлен в target

**Problem**: `Cannot find 'APIService' in scope`
**Solution**: Добавьте `Services/APIService.swift` в target

### Ошибки рантайма

**Problem**: Белый экран при запуске
**Solution**: Проверьте Console.app для логов

**Problem**: Login не работает
**Solution**: 
1. Проверьте что backend доступен
2. Проверьте URL в Settings
3. Посмотрите Network logs

### Xcode Project Issues

**Problem**: Файлы красные в Project Navigator
**Solution**: 
1. Выберите файл
2. File Inspector (⌥⌘1)
3. Проверьте Target Membership

## 📚 Дополнительная документация

- [NATIVE_INTEGRATION.md](./NATIVE_INTEGRATION.md) - Подробное описание интеграции
- [API Documentation](../backend/docs/API.md) - Backend API

## 🤝 Contribution

### Code Style

- SwiftUI views в отдельных файлах
- MARK: комментарии для секций
- Preview providers для каждого view
- Async/await для API calls

### Naming Conventions

- Views: `*View.swift` (e.g., `TasksView.swift`)
- Models: singular (e.g., `Task.swift`, не `Tasks.swift`)
- Services: `*Service.swift` (e.g., `APIService.swift`)

## 📊 Статус проекта

- ✅ Phase 1: Core structure & auth
- ✅ Phase 2: Tasks management
- ✅ Phase 3: Basic calendar
- 🚧 Phase 4: Advanced features
- ⏳ Phase 5: Polish & testing

## 📞 Support

Issues: https://github.com/your-repo/hostprint/issues

---

**Version**: 1.0.0  
**Min macOS**: 13.0 (Ventura)  
**Swift**: 5.9+
