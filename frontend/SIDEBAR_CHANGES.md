# Изменения в сайдбаре RWPrint

## Реализовано

### 1. Кнопка сворачивания сайдбара перемещена в footer
- **Было**: Кнопка находилась в шапке сайдбара
- **Стало**: Кнопка перемещена в самый низ сайдбара (в `sidebar-footer`)
- **Иконка**: Стрелка влево/вправо (ChevronLeft/ChevronRight)
- **Поведение**: При клике сворачивает/разворачивает сайдбар

### 2. Кнопки множественного выбора в сайдбаре
- **Было**: Кнопки "Выбрать все" и "Удалить" находились в downbar
- **Стало**: Кнопки перемещены в `sidebar-footer`, отображаются над списком файлов
- **Условие отображения**: Показываются только когда активирован режим выбора (галочка в downbar)

### 3. Split View остался в downbar
- Split View НЕ перемещался в сайдбар
- Остался на своем месте в downbar

## Структура sidebar-footer (снизу вверх)

```
┌────────────────────────────────┐
│                                │
│  СПИСОК ДОКУМЕНТОВ             │
│                                │
├────────────────────────────────┤
│ ╔════════════════════════════╗ │
│ ║ SIDEBAR FOOTER             ║ │
│ ║                            ║ │
│ ║ [Выбрать все]             ║ │ ← Только в режиме выбора
│ ║ [🗑 Удалить выбранные (N)] ║ │ ← Только в режиме выбора
│ ║                            ║ │
│ ║ ────────────────────────── ║ │
│ ║                            ║ │
│ ║ Выберите окружение      ▸  ║ │ ← Всегда
│ ║                            ║ │
│ ║ ────────────────────────── ║ │
│ ║                            ║ │
│ ║           [◀]              ║ │ ← Кнопка сворачивания
│ ╚════════════════════════════╝ │
└────────────────────────────────┘
```

## Измененные файлы

### `RWPrintContent.jsx`
1. Добавлена кнопка сворачивания в `sidebar-footer`:
```jsx
<button
  className="sidebar-toggle-btn"
  onClick={() => setIsCollapsed(!isCollapsed)}
  title={isCollapsed ? 'Развернуть' : 'Свернуть'}
>
  {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
</button>
```

2. Добавлены кнопки множественного выбора в `sidebar-footer`:
```jsx
{isSelectionMode && (
  <div className="sidebar-selection-actions">
    <button onClick={handleSelectAll}>
      Выбрать все
    </button>
    <button 
      onClick={handleDeleteSelected}
      disabled={selectedDocuments.size === 0}
    >
      🗑 Удалить выбранные ({selectedDocuments.size})
    </button>
  </div>
)}
```

3. Удалены эти кнопки из downbar

### `RWPrintContent.css`
Добавлены стили:

```css
/* Кнопка сворачивания в footer */
.sidebar-toggle-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.sidebar-toggle-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* Кнопки множественного выбора */
.sidebar-selection-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--border-primary);
}

.sidebar-selection-actions button {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-selection-actions button:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--accent);
}

.sidebar-selection-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Поведение

### Режим выбора ВЫКЛЮЧЕН:
- Видна только кнопка "Выберите окружение"
- Внизу кнопка сворачивания (стрелка)

### Режим выбора ВКЛЮЧЕН:
- Появляются кнопки "Выбрать все" и "Удалить"
- Кнопка "Удалить" показывает количество выбранных документов
- Кнопка "Удалить" disabled если ничего не выбрано
- Кнопка "Выберите окружение" остается видимой
- Внизу кнопка сворачивания (стрелка)

## Преимущества нового расположения

1. **Логичность**: Кнопки действий находятся рядом со списком, к которому они применяются
2. **Чистота интерфейса**: Downbar не "прыгает" при переключении режимов
3. **Константность**: Все элементы управления сайдбаром собраны в одном месте
4. **Удобство**: Кнопка сворачивания в самом низу - привычное место (как в VS Code, hostlog)
