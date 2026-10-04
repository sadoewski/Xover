# Инструкция: Встраивание Backend в macOS приложение

## ✅ Шаг 1: Backend уже упакован

Backend bundle уже создан в `macos-app/backend-bundle/` и готов к встраиванию.

## 📦 Шаг 2: Добавление в Xcode

### Вариант А: Через Xcode GUI (рекомендуется)

1. **Откройте проект в Xcode**
   ```bash
   open /Users/sadoewski/projects/hostprint/macos-app/Xover.xcodeproj
   ```

2. **Добавьте backend-bundle как Folder Reference**
   - В левой панели (Project Navigator) кликните правой кнопкой на папку `Xover`
   - Выберите **Add Files to "Xover"...**
   - Найдите папку `backend-bundle` (она в `macos-app/backend-bundle`)
   - ⚠️ **ВАЖНО**: Выберите **"Create folder references"** (НЕ "Create groups")
   - Убедитесь, что галочка **"Copy items if needed"** СНЯТА
   - Target должен быть `Xover`
   - Нажмите **Add**

3. **Проверьте Build Phases**
   - Выберите проект `Xover` в Project Navigator
   - Перейдите на вкладку **Build Phases**
   - Раскройте **Copy Bundle Resources**
   - Убедитесь, что `backend-bundle` там есть (должна быть синяя папка 📁)
   - Если нет - нажмите **+** и добавьте `backend-bundle`

4. **Соберите проект**
   ```
   ⌘B (Product → Build)
   ```

### Вариант Б: Автоматическое добавление (если нужно)

Если что-то пошло не так, можно использовать скрипт для автоматической настройки Xcode проекта.

## 🚀 Шаг 3: Финальная сборка и установка

После добавления backend-bundle в Xcode:

1. **Clean Build Folder**
   ```
   ⌘⇧K (Product → Clean Build Folder)
   ```

2. **Build проект**
   ```
   ⌘B (Product → Build)
   ```

3. **Скопируйте .app в Applications**
   ```bash
   # Выполните этот скрипт после успешной сборки:
   ./install-app.sh
   ```

## ✅ Проверка установки

После установки проверьте, что backend встроен:

```bash
ls -la /Applications/Xover.app/Contents/Resources/backend-bundle/
ls -la /Applications/Xover.app/Contents/Resources/backend-bundle/nodejs/bin/node
```

Должны увидеть:
- ✅ Папку `backend-bundle` с исходниками
- ✅ `nodejs/bin/node` - Node.js runtime
- ✅ `node_modules/` - зависимости
- ✅ `src/` - код backend

## 🎯 Запуск приложения

Теперь просто дважды кликните на **Xover.app** в Applications:
- Backend запустится автоматически
- База данных создастся в `~/Library/Application Support/com.hostprint.Xover/`
- Приложение откроет веб-интерфейс на `http://localhost:3001`

## 🔧 Обновление Backend

Если нужно обновить backend:

```bash
cd /Users/sadoewski/projects/hostprint/macos-app
./bundle-backend.sh
# Затем пересоберите в Xcode (⌘B) и переустановите
```

## ❌ Устранение проблем

### "Backend not found" ошибка

```bash
# Проверьте, что backend-bundle скопирован в .app:
ls -la ~/Library/Developer/Xcode/DerivedData/*/Build/Products/Debug/Xover.app/Contents/Resources/

# Должна быть папка backend-bundle
```

### Node.js runtime не найден

```bash
# Пересоздайте bundle (он скопирует Node.js заново):
./bundle-backend.sh
```

### База данных не создаётся

```bash
# Проверьте права:
ls -la ~/Library/Application\ Support/com.hostprint.Xover/

# Очистите и пересоздайте:
rm -rf ~/Library/Application\ Support/com.hostprint.Xover/
# Перезапустите приложение
```

## 📝 Примечания

- Backend упакован в **production mode** (без dev-зависимостей)
- Node.js runtime (~100MB) встроен в приложение
- База данных SQLite хранится в Application Support (не в .app)
- Порт по умолчанию: **3001** (можно изменить в настройках)
- Первый запуск может занять ~5-10 секунд (инициализация БД)
