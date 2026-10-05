# 🎨 Xover App Icon Setup

## ✅ Статус: Иконки настроены правильно!

### Что уже сделано:

1. ✅ **Иконки созданы** во всех нужных размерах:
   - 16x16, 32x32, 128x128, 256x256, 512x512
   - Каждая в @1x и @2x вариантах
   - Формат: PNG с альфа-каналом

2. ✅ **Contents.json настроен** правильно
   - Все размеры связаны с файлами
   - Правильный формат для macOS

3. ✅ **Assets.xcassets подключён** к проекту
   - Включён в Resources
   - `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`

---

## 🔧 Применение иконок

### Вариант 1: Через Xcode (Рекомендуется)

1. **Clean Build Folder**
   - В Xcode: `Product → Clean Build Folder`
   - Или: `Cmd+Shift+K`

2. **Build**
   - В Xcode: `Product → Build`
   - Или: `Cmd+B`

3. **Run**
   - В Xcode: `Product → Run`
   - Или: `Cmd+R`

После запуска иконка должна появиться в Dock!

### Вариант 2: Полный сброс кэша (если иконка не появилась)

Запусти скрипт:
```bash
cd /Users/sadoewski/projects/hostprint/macos-app
./refresh-icon.sh
```

Что делает скрипт:
- Останавливает приложение
- Очищает системный кэш иконок
- Очищает DerivedData Xcode
- Перезапускает Dock и Finder

После этого пересобери в Xcode (Cmd+Shift+K → Cmd+B → Cmd+R).

---

## 🖼️ Где увидишь иконку

После успешной сборки иконка появится:

1. **В Dock** — когда приложение запущено
2. **В Applications** — если установишь приложение
3. **В Cmd+Tab** — при переключении приложений
4. **В Activity Monitor** — в списке процессов

---

## 🎯 Проверка в Xcode

### Перед сборкой:

1. Открой проект в Xcode
2. В Project Navigator выбери проект **Xover**
3. Выбери target **Xover**
4. Вкладка **General**
5. Секция **App Icon and Launch Screen**
6. Должно быть: `App Icon: AppIcon`

### Просмотр иконок:

1. В Project Navigator найди `Assets.xcassets`
2. Кликни на `AppIcon`
3. Увидишь все размеры иконок с превью

---

## 🐛 Troubleshooting

### Иконка не появляется после сборки:

1. Проверь что target правильный:
   ```
   Xcode → Product → Scheme → Xover
   ```

2. Проверь Build Settings:
   ```
   ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon
   ```

3. Запусти полный сброс:
   ```bash
   ./refresh-icon.sh
   ```

### Иконка старая (кэш):

macOS кэширует иконки агрессивно. Решения:

1. **Перезапусти Dock**:
   ```bash
   killall Dock
   ```

2. **Очисти кэш иконок системы**:
   ```bash
   sudo rm -rf /Library/Caches/com.apple.iconservices.store
   killall Dock
   ```

3. **Переименуй Bundle ID** (крайняя мера):
   - Xcode → Target → General → Bundle Identifier
   - Измени на `com.xover.desktop.test`
   - Пересобери

### Иконка размытая:

Проверь что используются @2x версии для Retina:
```bash
ls -lh Assets.xcassets/AppIcon.appiconset/ | grep @2x
```

Должны быть файлы:
- icon_16x16@2x.png (32px)
- icon_32x32@2x.png (64px)
- icon_128x128@2x.png (256px)
- icon_256x256@2x.png (512px)
- icon_512x512@2x.png (1024px)

---

## 📐 Технические детали

### Размеры иконок macOS:

| Размер | @1x | @2x | Использование |
|--------|-----|-----|---------------|
| 16×16 | 16px | 32px | Меню, малые списки |
| 32×32 | 32px | 64px | Списки, боковые панели |
| 128×128 | 128px | 256px | Dock (маленький) |
| 256×256 | 256px | 512px | Dock (средний) |
| 512×512 | 512px | 1024px | Dock (большой), About |

### Формат:

- **Тип**: PNG с альфа-каналом (RGBA)
- **Цветовое пространство**: sRGB
- **Сжатие**: PNG (без потерь)
- **Разрешение**: 72 DPI (стандарт для экрана)

---

## ✨ Результат

После выполнения всех шагов Xover будет иметь профессиональную иконку во всех размерах, правильно отображающуюся на Retina и обычных дисплеях!

**Текущий статус**: ✅ Все иконки на месте, настройки проекта правильные
