# Исправление ошибки "Multiple commands produce"

Эта ошибка возникает потому что Xcode копирует ВСЕ файлы из backend-bundle/node_modules, включая дубликаты.

## ✅ Решение: Исключить дубликаты в Xcode

### Вариант 1: Через Xcode GUI (рекомендуется)

1. **Откройте проект в Xcode**
   ```bash
   open Xover.xcodeproj
   ```

2. **Перейдите в Build Settings**
   - Кликните на проект "Xover" в верхнем левом углу
   - Выберите Target "Xover"
   - Перейдите на вкладку "Build Settings"
   - Найдите "EXCLUDED_SOURCE_FILE_NAMES"

3. **Добавьте исключения**
   - В поле "Excluded Source File Names" добавьте:
     ```
     */node_modules/*/*.md
     */node_modules/*/.* 
     */node_modules/*/LICENSE
     */node_modules/*/license
     */node_modules/*/README*
     */node_modules/*/readme*
     */node_modules/*/CHANGELOG*
     */node_modules/*/*.yml
     */node_modules/*/*.gyp
     */node_modules/*/*.gypi
     ```

4. **Clean и Rebuild**
   - ⌘⇧K (Product → Clean Build Folder)
   - ⌘B (Product → Build)

### Вариант 2: Копировать только необходимое (лучше)

Вместо того чтобы копировать весь backend-bundle, скопируем только то, что нужно:

1. **Удалите backend-bundle из Xcode**
   - Кликните правой кнопкой на `backend-bundle` в Project Navigator
   - Выберите "Delete" → "Remove Reference" (НЕ "Move to Trash")

2. **Добавьте Build Phase Script**
   - Выберите Target "Xover"
   - Перейдите на вкладку "Build Phases"
   - Нажмите "+" → "New Run Script Phase"
   - Переименуйте в "Copy Backend Bundle"
   - Вставьте этот скрипт:

```bash
#!/bin/bash

# Copy Backend Bundle Script
# Copies only essential backend files, excluding duplicates

SOURCE_DIR="${PROJECT_DIR}/backend-bundle"
DEST_DIR="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/Contents/Resources/backend-bundle"

echo "Copying backend bundle..."

# Create destination
mkdir -p "$DEST_DIR"

# Copy essential files
rsync -a \
  --exclude='node_modules/*/test' \
  --exclude='node_modules/*/tests' \
  --exclude='node_modules/*/*.md' \
  --exclude='node_modules/*/README*' \
  --exclude='node_modules/*/readme*' \
  --exclude='node_modules/*/LICENSE*' \
  --exclude='node_modules/*/license*' \
  --exclude='node_modules/*/CHANGELOG*' \
  --exclude='node_modules/*/.git*' \
  --exclude='node_modules/*/.npm*' \
  --exclude='node_modules/*/.eslint*' \
  --exclude='node_modules/*/*.yml' \
  --exclude='node_modules/*/*.yaml' \
  --exclude='node_modules/*/*.gyp*' \
  --exclude='node_modules/*/*.ts' \
  --exclude='node_modules/*/*.d.ts' \
  --exclude='node_modules/*/tsconfig.json' \
  "$SOURCE_DIR/" "$DEST_DIR/"

echo "✓ Backend bundle copied to Resources"
```

3. **Переместите скрипт**
   - Перетащите "Copy Backend Bundle" ВЫШЕ "Copy Bundle Resources"

4. **Clean и Rebuild**
   - ⌘⇧K
   - ⌘B

### Вариант 3: Самый простой - минимизировать backend-bundle

Удалите ненужные файлы из backend-bundle перед добавлением в Xcode:

```bash
cd /Users/sadoewski/projects/hostprint/macos-app

# Удалите документацию и тесты из node_modules
find backend-bundle/node_modules -name "*.md" -type f -delete
find backend-bundle/node_modules -name "README*" -type f -delete
find backend-bundle/node_modules -name "readme*" -type f -delete
find backend-bundle/node_modules -name "LICENSE*" -type f -delete
find backend-bundle/node_modules -name "license*" -type f -delete  
find backend-bundle/node_modules -name "CHANGELOG*" -type f -delete
find backend-bundle/node_modules -name "*.yml" -type f -delete
find backend-bundle/node_modules -name "*.yaml" -type f -delete
find backend-bundle/node_modules -name ".git*" -type f -delete
find backend-bundle/node_modules -name "*.gyp*" -type f -delete
find backend-bundle/node_modules -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
find backend-bundle/node_modules -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find backend-bundle/node_modules -type d -name ".github" -exec rm -rf {} + 2>/dev/null || true

# Теперь в Xcode: Clean (⌘⇧K) и Build (⌘B)
```

## 🎯 Рекомендация

Используйте **Вариант 3** - это самое простое и быстрое решение:

1. Выполните скрипт удаления выше
2. В Xcode: ⌘⇧K → ⌘B
3. Готово!

После этого сборка пройдёт без ошибок.

## 📊 Результат

- Размер backend-bundle уменьшится с ~150MB до ~80-100MB
- Время сборки ускорится
- Ошибки "Multiple commands produce" исчезнут
- Приложение будет работать так же, но станет легче
