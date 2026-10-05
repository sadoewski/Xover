# macOS App Integration Guide

## WebView Bridge API

Приложение macOS предоставляет JavaScript bridge для интеграции с нативными функциями.

### Доступные методы

#### Навигация
```javascript
// Навигация к определенному маршруту
window.swift.navigate('/tasks');
window.swift.navigate('/datatasks');
window.swift.navigate('/sites');
```

#### Создание задач
```javascript
// Создать новую задачу (вызывается из File > New Task)
window.swift.createTask();

// Создать новую data task (вызывается из File > New Data Task)
window.swift.createDataTask();
```

#### Другие функции
```javascript
// Логирование в нативной консоли
window.swift.log('Debug message');

// Показать нативное уведомление
window.swift.showNotification('Title', 'Body text');

// Открыть URL во внешнем браузере
window.swift.openExternal('https://example.com');

// Копировать текст в буфер обмена
window.swift.copyToClipboard('text to copy');

// Получить системную информацию
window.swift.getSystemInfo((info) => {
    console.log(info.platform); // 'macos'
    console.log(info.version);
    console.log(info.arch); // 'arm64' или 'x86_64'
});

// Выбрать файл
window.swift.selectFile(['txt', 'json'], (result) => {
    if (result) {
        console.log(result.path);
        console.log(result.filename);
    }
});

// Сохранить файл
window.swift.saveFile('output.txt', 'file content', (result) => {
    if (result.success) {
        console.log('Saved to:', result.path);
    }
});
```

## Требуемая интеграция в веб-приложении

Для работы меню File и Navigate нужно добавить обработчики в веб-приложение:

### 1. Проверка доступности bridge

```javascript
// Проверить, что приложение работает в macOS app
const isMacOSApp = typeof window.swift !== 'undefined' && window.swiftBridgeReady;

if (isMacOSApp) {
    console.log('Running in macOS app');
}
```

### 2. Обработка команд меню

```javascript
// Обработка File > New Task
window.addEventListener('swift-create-task', () => {
    // Ваш код для создания новой задачи
    // Например, открыть модальное окно или перейти на страницу создания
});

// Обработка File > New Data Task
window.addEventListener('swift-create-data-task', () => {
    // Ваш код для создания новой data task
});
```

### 3. Альтернативный подход через глобальные функции

Можно также определить глобальные функции, которые будет вызывать bridge:

```javascript
// В вашем главном файле приложения
window.handleCreateTask = function() {
    // Логика создания задачи
    router.push('/tasks/new');
};

window.handleCreateDataTask = function() {
    // Логика создания data task
    router.push('/datatasks/new');
};
```

## Меню приложения

### File Menu
- **New Task** (⌘N) - создать новую задачу
- **New Data Task** (⌘⇧N) - создать новую data task

### Navigate Menu
- **Dashboard** (⌘1) - перейти на главную
- **Tasks** (⌘2) - перейти к задачам
- **Data Tasks** (⌘3) - перейти к data tasks
- **Sites** (⌘4) - перейти к сайтам
- **RW Print** (⌘5) - перейти к RW Print
- **Back** (⌘[) - назад
- **Forward** (⌘]) - вперед

### View Menu
- **Reload** (⌘R) - перезагрузить страницу
- **Actual Size** (⌘0) - сбросить масштаб
- **Zoom In** (⌘+) - увеличить
- **Zoom Out** (⌘-) - уменьшить
- **Toggle Developer Tools** (⌘⌥I) - открыть DevTools

## Изменения в UI

Приложение больше не показывает:
- Адресную строку с URL
- Кнопки навигации (вперед/назад/обновить)
- Статус бар с режимом работы

Теперь приложение выглядит как нативное macOS приложение, а не как браузер.
