# План редизайна macOS приложения Hostprint
## Нативный SwiftUI интерфейс

**Дата:** 11 октября 2026  
**Версия:** 1.0  
**Статус:** План утвержден к реализации

---

## 🎯 Цель проекта

Трансформировать текущее macOS приложение Hostprint из WebView-обёртки над React веб-приложением в полностью нативное SwiftUI приложение с macOS дизайном и UX паттернами.

### Ключевые принципы:
- ✅ **Сохранить весь функционал** веб-версии
- ✅ **Использовать нативный SwiftUI** дизайн и компоненты
- ✅ **Следовать macOS HIG** (Human Interface Guidelines)
- ✅ **Один backend API** для обеих версий
- ✅ **Постепенная миграция** с возможностью отката

---

## 📊 Текущая архитектура

### Проблемы WebView подхода:
1. **Не нативный вид** - React UI с веб-стилизацией
2. **Performance overhead** - WebView рендеринг тратит память и CPU
3. **Двухслойная архитектура** - Native → WebView → React → Backend
4. **Ограниченная интеграция** - доступ к macOS фичам только через JavaScript bridge
5. **Веб-паттерны взаимодействия** - HTML контролы вместо нативных
6. **CSS dark mode** вместо нативного NSAppearance
7. **Отсутствие нативных фич** - контекстные меню, Touch Bar, Spotlight, drag & drop
8. **Сложность отладки** - требуется Web Inspector

### Что работает хорошо:
- ✅ BackendManager.swift - управление Node.js процессом
- ✅ SyncManager.swift - offline queue и network monitoring
- ✅ Backend API - стабильный и полнофункциональный

---

## 🎨 Нативный SwiftUI дизайн

### UI Архитектура

#### Главная структура окна:
```swift
NavigationSplitView (three-column)
├── Sidebar (240-320pt, collapsible)
│   ├── Header (user profile, status)
│   ├── Navigation List
│   │   ├── Dashboard
│   │   ├── Calendar
│   │   ├── Tasks
│   │   ├── Data Tasks
│   │   ├── RW Print
│   │   ├── Terminal
│   │   └── Settings
│   └── Footer (sync status, storage)
│
├── Content (main area)
│   └── Dynamic view based on selection
│
└── Inspector (260-320pt, optional)
    └── Context-sensitive details
```

#### Навигационные паттерны:
- **NavigationSplitView** - нативная трёхколоночная навигация macOS
- **Master-Detail** - для списков задач и документов
- **Modal Sheets** - для создания/редактирования
- **Popovers** - для быстрых действий
- **Keyboard navigation** - полная поддержка клавиатуры

### Дизайн-система

#### Типографика (SF Pro):
- **Large Title**: 26pt, Bold
- **Title 1**: 22pt, Semibold
- **Title 2**: 17pt, Semibold
- **Title 3**: 15pt, Semibold
- **Headline**: 13pt, Semibold
- **Body**: 13pt, Regular
- **Callout**: 12pt, Regular
- **Footnote**: 11pt, Regular
- **Caption**: 10pt, Regular

#### Цветовая палитра:
```swift
// Semantic colors (auto-adapt to light/dark)
Primary: NSColor.controlAccentColor
Secondary: NSColor.secondaryLabelColor
Tertiary: NSColor.tertiaryLabelColor
Background: NSColor.controlBackgroundColor
Surface: NSColor.windowBackgroundColor
```

