# Task Management Implementation

## Созданные файлы

### Models
- `Models/Task.swift` - Модель задачи с поддержкой групп и приоритетов
- `Models/TaskGroup.swift` - Модель группы задач
- `Models/Priority.swift` - Модель приоритета с поддержкой цветов

### Views  
- `Views/Tasks/NewTaskSheet.swift` - Форма создания новой задачи
- `Views/Tasks/TaskGroupsSheet.swift` - Управление группами задач
- `Views/Tasks/PrioritiesSheet.swift` - Управление приоритетами

### Updated Files
- `Models/AppState.swift` - Добавлены методы для работы с группами и приоритетами
- `Services/APIService.swift` - Добавлены API методы для групп и приоритетов
- `Views/Tasks/TasksView.swift` - Уже настроен для работы с новыми возможностями

## API Endpoints

### Task Groups
- `GET /api/task-groups` - Получить список групп
- `POST /api/task-groups` - Создать группу
- `DELETE /api/task-groups/:id` - Удалить группу

### Priorities
- `GET /api/priorities` - Получить список приоритетов
- `POST /api/priorities` - Создать приоритет
- `DELETE /api/priorities/:id` - Удалить приоритет

## Features

1. **Создание задач** - полная форма с выбором группы, приоритета, статуса и срока
2. **Управление группами** - создание и удаление групп задач
3. **Управление приоритетами** - создание приоритетов с выбором цвета
4. **Фильтрация** - TasksView поддерживает фильтрацию по статусу и поиск

## Следующие шаги

1. Добавить новые файлы в Xcode проект
2. Проверить компиляцию
3. Протестировать работу с API

## Notes

- Все модели используют правильные snake_case для API (priority_id, group_id, due_date, etc.)
- Color extension добавлен в Priority.swift для работы с hex цветами
- AppState методы асинхронные и обновляют локальное состояние после успешных API вызовов
