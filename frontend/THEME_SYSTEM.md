# Система тем (Dark/Light Mode)

## Реализовано

### 1. Контекст темы (`ThemeContext.jsx`)
- Управление состоянием темы (dark/light)
- Сохранение выбора в localStorage
- Применение класса `data-theme` к `<html>` элементу
- Хук `useTheme()` для использования в компонентах

### 2. CSS переменные (`theme.css`)
- Темная тема (по умолчанию)
- Светлая тема
- Все цвета определены через CSS переменные:
  - Фоновые цвета (bg-primary, bg-secondary, bg-tertiary)
  - Цвета текста (text-primary, text-secondary, text-tertiary)
  - Цвета границ (border-primary, border-secondary)
  - Акцентные цвета (accent, accent-hover)
  - Статусные цвета (success, warning, danger, info)

### 3. Переключатель темы
- Расположен в правом верхнем углу navbar
- Рядом с фото пользователя
- Иконки: Sun (для включения светлой) / Moon (для включения темной)
- Плавные анимации при наведении и клике

### 4. Структура интеграции
```
App.jsx
  └─ ThemeProvider (обертка всего приложения)
      └─ AuthProvider
          └─ Routes

ProfessionalLayout.jsx
  ├─ useTheme() hook
  └─ Theme toggle button в navbar
```

## Использование

### В компонентах:
```jsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Текущая тема: {theme}
    </button>
  );
}
```

### В CSS:
```css
.my-element {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

/* Специфичные стили для темной темы */
[data-theme="dark"] .my-element {
  /* переопределения */
}

/* Специфичные стили для светлой темы */
[data-theme="light"] .my-element {
  /* переопределения */
}
```

## Особенности

- Тема автоматически сохраняется в localStorage
- При первом посещении используется темная тема
- Тема применяется мгновенно без перезагрузки страницы
- Все существующие компоненты автоматически адаптируются через CSS переменные

## Расширение

Для добавления новой цветовой переменной:

1. Добавить в `theme.css` для обеих тем:
```css
:root {
  --my-new-color: #value-dark;
}

[data-theme="light"] {
  --my-new-color: #value-light;
}
```

2. Использовать в CSS:
```css
.element {
  color: var(--my-new-color);
}
```
