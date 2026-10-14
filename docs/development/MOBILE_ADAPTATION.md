# Мобильная адаптация Xover

## Обзор

Приложение Xover теперь полностью адаптировано для мобильных устройств. Интерфейс автоматически подстраивается под размер экрана и тип устройства.

## Поддерживаемые устройства

### 📱 Мобильные телефоны (< 767px)
- **Портретная ориентация**: Оптимизированный вертикальный интерфейс
- **Альбомная ориентация**: Адаптированный горизонтальный режим
- Увеличенные touch-таргеты (минимум 44x44px)
- Мобильное меню с overlay
- Компактные элементы управления

### 📱 Маленькие телефоны (< 480px)
- Ещё более компактный интерфейс
- Иконки вместо текста где возможно
- Упрощенная навигация
- Одноколоночные layout'ы

### 📲 Планшеты (768px - 1024px)
- Средний размер элементов
- Частично скрытые метки
- Оптимизированные отступы

### 💻 Десктоп (> 1024px)
- Полноценный интерфейс
- Все функции доступны
- Боковая панель навигации

## Основные изменения

### 1. Viewport и Meta-теги
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### 2. Мобильная навигация
- **Hamburger меню** (☰) для открытия сайдбара
- **Overlay затемнение** при открытом меню
- **Автоматическое закрытие** при переходе на другую страницу
- **Блокировка скролла body** при открытом меню

### 3. Адаптивные компоненты

#### Тулбар
- Переключатель разделов в центре на мобильных
- Скрытие имени пользователя
- Компактные кнопки

#### Боковая панель
- Скрыта по умолчанию на мобильных
- Выдвигается поверх контента
- Ширина 280px на мобильных
- Touch-friendly размеры элементов

#### Breadcrumbs
- Горизонтальная прокрутка на мобильных
- Скрытие scrollbar

#### Формы
- Увеличенные поля ввода (font-size: 16px для предотвращения zoom на iOS)
- Минимальная высота 44px для кнопок
- Полная ширина кнопок в модальных окнах

#### Таблицы
- Горизонтальная прокрутка
- Компактные ячейки
- Увеличенные touch-таргеты

### 4. Touch-оптимизации
```css
/* Убираем highlight при нажатии */
-webkit-tap-highlight-color: transparent;

/* Плавная прокрутка на iOS */
-webkit-overflow-scrolling: touch;

/* Запрет выделения текста UI элементов */
user-select: none;
```

### 5. Safe Area для устройств с вырезами
```css
@supports (padding: env(safe-area-inset-top)) {
  .professional-layout {
    padding-top: env(safe-area-inset-top);
  }
}
```

## Файлы с мобильными стилями

### Основные файлы
- `src/styles/mobile.css` - Общие мобильные стили для layout
- `src/styles/components.css` - Адаптивные компоненты (кнопки, формы)
- `src/styles/pages.css` - Адаптивные стили страниц

### Страницы
- `src/pages/CalendarPageNew.css` - Календарь
- `src/pages/DashboardPage.css` - Dashboard
- `src/pages/AuthPages.css` - Авторизация/регистрация
- `src/components/ProfessionalLayout.css` - Основной layout

## React Hooks для адаптивности

### useMediaQuery
```javascript
import { useIsMobile, useIsTablet, useIsDesktop } from '../hooks/useMediaQuery';

function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

### Доступные хуки
- `useIsMobile()` - < 767px
- `useIsTablet()` - 768px - 1024px
- `useIsDesktop()` - > 1024px
- `useIsSmallMobile()` - < 480px
- `useIsTouchDevice()` - Touch screen устройства
- `useIsLandscape()` - Альбомная ориентация
- `useBreakpoints()` - Все breakpoints сразу

## Breakpoints

```css
/* Планшеты */
@media (max-width: 1024px) { }

/* Мобильные */
@media (max-width: 767px) { }

/* Маленькие мобильные */
@media (max-width: 480px) { }

/* Очень маленькие */
@media (max-width: 375px) { }

/* Альбомная ориентация */
@media (max-height: 500px) and (orientation: landscape) { }

/* Touch устройства */
@media (hover: none) and (pointer: coarse) { }
```

## Тестирование

### Chrome DevTools
1. Откройте DevTools (F12)
2. Нажмите Toggle Device Toolbar (Ctrl+Shift+M)
3. Выберите устройство или задайте custom размер

### Реальные устройства
Протестировано на:
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)

### Рекомендуемые размеры для тестирования
- iPhone SE: 375x667
- iPhone 12/13/14: 390x844
- iPhone 14 Pro Max: 430x932
- Samsung Galaxy S20: 360x800
- iPad: 768x1024
- iPad Pro: 1024x1366

## Особенности iOS

### Предотвращение zoom при фокусе
```css
input, select, textarea {
  font-size: 16px; /* Минимум 16px предотвращает zoom */
}
```

### Скрытие адресной строки
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## Производительность

### Оптимизации
- CSS будет применяться только на соответствующих устройствах (media queries)
- Нет дублирования кода
- Минимальные JavaScript вычисления для определения устройства
- Используется `matchMedia` API для эффективного отслеживания breakpoints

## Известные ограничения

1. **Таблицы**: На очень маленьких экранах используется горизонтальная прокрутка
2. **Модальные окна**: Занимают почти весь экран на мобильных
3. **Календарь**: Требует горизонтальной прокрутки на мобильных для полной функциональности

## Будущие улучшения

- [ ] PWA поддержка (установка как приложение)
- [ ] Жесты swipe для навигации
- [ ] Оптимизация для складных устройств
- [ ] Темная тема для OLED экранов
- [ ] Вибро-отклик для touch действий
- [ ] Офлайн режим

## Как использовать

### В браузере на телефоне
1. Откройте приложение в браузере на телефоне
2. Интерфейс автоматически адаптируется
3. Используйте меню (☰) для навигации

### PWA установка (в будущем)
1. Откройте приложение в Safari/Chrome
2. Нажмите "Добавить на домашний экран"
3. Используйте как нативное приложение

## Контрольный список для разработчиков

При добавлении новых компонентов:
- [ ] Проверить на мобильных (< 767px)
- [ ] Проверить на маленьких экранах (< 480px)
- [ ] Убедиться что touch-таргеты >= 44x44px
- [ ] Протестировать в портретной и альбомной ориентации
- [ ] Проверить на реальном устройстве
- [ ] Убедиться что формы не зумятся на iOS (font-size >= 16px)
- [ ] Проверить горизонтальную прокрутку (не должно быть)
- [ ] Протестировать с открытой клавиатурой

## Поддержка браузеров

- ✅ Chrome 90+ (Android, Desktop)
- ✅ Safari 14+ (iOS, macOS)
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Samsung Internet 14+

## Ресурсы

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
- [Apple: Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design: Layout](https://material.io/design/layout/responsive-layout-grid.html)
