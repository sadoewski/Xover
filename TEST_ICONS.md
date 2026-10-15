# Тестирование функционала иконок

## Что было сделано:

### 1. База данных
✅ Добавлена колонка `icon` в таблицу `task_groups` (VARCHAR(50), default 'folder')
✅ Добавлена колонка `icon` в таблицу `taskbases` (VARCHAR(50), default 'refresh')

### 2. Backend API
✅ **tasksController.js** - обновлены все SELECT запросы для включения `tg.icon as group_icon`:
   - Строка 107: getAllTasks
   - Строка 137: getTasksByDate
   - Строка 167: getTaskById
   - Строка 430: updateTask

✅ **taskbasesController.js** - обновлены SELECT запросы:
   - Строка 10: getAllTaskBases - добавлены `tg.icon as group_icon` и обновлен GROUP BY
   - Строка 39: getTaskBase - добавлена `tg.icon as group_icon`
   - CREATE запрос поддерживает поле `icon`

✅ **terminalController.js** - обновлены SELECT запросы:
   - Строка 87: getTasksByDate - добавлена `tg.icon as group_icon`
   - Строка 185: getTaskById - добавлены `tg.color` и `tg.icon as group_icon`

✅ **groupsController.js** - CREATE и UPDATE поддерживают иконку

### 3. Frontend компоненты

✅ **IconPicker.jsx** - компонент выбора иконок из Tabler Icons
✅ **IconPickerButton.jsx** - кнопка с предпросмотром выбранной иконки
✅ **TablerIconRenderer.jsx** - рендерер иконок из Tabler Icons

✅ **GroupsPage.jsx**:
   - Добавлен выбор иконки при создании группы
   - Отображение иконки в списке групп
   - Стили для иконок

✅ **CreateTaskBasePage.jsx**:
   - Добавлен выбор иконки в шаге 1
   - Отображение иконки в шаге 3 (подтверждение)
   - Передача иконки в API

✅ **TaskBasesPage.jsx**:
   - Отображение иконки в карточках taskbases
   - Стили для иконок

✅ **CalendarPageNew.jsx**:
   - Исправлена ошибка `loadData is not defined`
   - Добавлен `refreshTrigger` для обновления данных

## Как проверить:

### 1. Проверка групп
1. Зайти в /groups
2. Создать новую группу с выбором иконки
3. Проверить, что иконка отображается в списке

### 2. Проверка TaskBase
1. Зайти в /taskbases
2. Создать новый TaskBase с выбором иконки
3. Проверить, что иконка отображается в карточке

### 3. Проверка задач
1. Зайти в календарь
2. Создать задачу
3. Проверить, что иконка группы отображается в карточке задачи

## Потенциальные проблемы:

1. **Миграции не запущены** - нужно выполнить миграции для добавления колонок
2. **Существующие записи** - у существующих групп и taskbases иконки будут `NULL`, нужно установить дефолтные значения
3. **Кэширование** - возможно потребуется перезапустить фронтенд и бэкенд

## SQL для проверки:

```sql
-- Проверить колонки
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name IN ('task_groups', 'taskbases') 
AND column_name = 'icon';

-- Обновить существующие записи
UPDATE task_groups SET icon = 'folder' WHERE icon IS NULL;
UPDATE taskbases SET icon = 'refresh' WHERE icon IS NULL;
```
