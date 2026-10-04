# 🚀 Быстрый старт: Создание standalone macOS приложения

## ✅ Backend bundle готов и оптимизирован!

Backend bundle уже создан, оптимизирован (41MB) и готов к встраиванию в приложение.

---

## 📦 Шаг 1: Добавить backend-bundle в Xcode (ОДИН РАЗ)

1. Откройте проект:
   ```bash
   open Xover.xcodeproj
   ```

2. В Xcode:
   - **Кликните правой кнопкой** на папку `Xover` (слева в Project Navigator)
   - Выберите **"Add Files to Xover..."**
   - Найдите и выберите папку **`backend-bundle`**
   - ⚠️ **ВАЖНО**: Выберите **"Create folder references"** (синяя папка 📁, НЕ жёлтая)
   - Убедитесь, что галочка **"Copy items if needed" СНЯТА**
   - Нажмите **Add**

3. Проверьте (необязательно):
   - Выберите проект `Xover` → вкладка **Build Phases**
   - Откройте **Copy Bundle Resources**
   - Убедитесь, что там есть `backend-bundle` (синяя папка)

---

## 🔨 Шаг 2: Собрать приложение

В Xcode:
```
⌘⇧K  (Clean Build Folder)
⌘B   (Build)
```

**Ожидайте "Build Succeeded" ✅**

---

## 📲 Шаг 3: Установить в Applications

```bash
cd /Users/sadoewski/projects/hostprint/macos-app
./install-app.sh
```

Готово! 🎉

---

## 🎯 Использование

### Запуск приложения

Просто **дважды кликните** на **Xover.app** в папке Applications (Программы).

Или из терминала:
```bash
open /Applications/Xover.app
```

### Что происходит при запуске

1. ✅ Приложение запускается
2. ✅ Backend автоматически стартует (Node.js встроен)
3. ✅ База данных создаётся в `~/Library/Application Support/com.hostprint.Xover/`
4. ✅ Открывается веб-интерфейс на `http://localhost:3001`

### Настройки

- Откройте **Preferences** (⌘,) для настройки порта и других параметров
- По умолчанию backend запускается на порту **3001**
- Можно переключиться в **Standalone Mode** (работа без облака)

---

## 🔄 Обновление после изменений

### Если изменили backend код:

```bash
cd /Users/sadoewski/projects/hostprint/macos-app
./bundle-backend.sh        # Пересоздать bundle

# Оптимизировать (удалить ненужное)
find backend-bundle/node_modules -name "*.md" -type f -delete
find backend-bundle/node_modules -name "README*" -type f -delete
find backend-bundle/node_modules -name "LICENSE*" -type f -delete
find backend-bundle/node_modules -name "*.yml" -type f -delete
find backend-bundle/node_modules -type d -name "test" -exec rm -rf {} + 2>/dev/null || true

# Затем в Xcode: ⌘⇧K → ⌘B
./install-app.sh           # Переустановить
```

### Если изменили Swift код:

```bash
# В Xcode: ⌘⇧K → ⌘B
./install-app.sh
```

---

## 📁 Где что находится

### В разработке:
- **Исходники**: `/Users/sadoewski/projects/hostprint/`
- **Backend bundle**: `/Users/sadoewski/projects/hostprint/macos-app/backend-bundle/` (41MB, оптимизирован)
- **Xcode проект**: `/Users/sadoewski/projects/hostprint/macos-app/Xover.xcodeproj`

### После установки:
- **Приложение**: `/Applications/Xover.app`
- **База данных**: `~/Library/Application Support/com.hostprint.Xover/hostprint.db`
- **Логи**: Console.app → фильтр "Xover"

---

## ❓ FAQ

### Backend не запускается?

Проверьте, что backend-bundle встроен:
```bash
ls -la /Applications/Xover.app/Contents/Resources/backend-bundle/
```

Должны увидеть папки: `nodejs`, `node_modules`, `src`

### Ошибка "Multiple commands produce"?

Это уже исправлено! Backend bundle оптимизирован (удалены дубликаты README, LICENSE и т.д.).

Если ошибка всё равно появляется:
```bash
cd /Users/sadoewski/projects/hostprint/macos-app
cat FIX_BUILD.md  # Подробные инструкции по исправлению
```

### Хочу поделиться .app с друзьями?

Просто скопируйте `/Applications/Xover.app` на другой Mac.

⚠️ **Внимание**: Для распространения вне вашего Mac нужна подпись приложения (code signing).

### Как создать DMG для распространения?

```bash
# TODO: Добавить скрипт для создания DMG
# Пока можно использовать Disk Utility или hdiutil
```

### Нужно изменить иконку?

1. Создайте `AppIcon.icns`
2. Добавьте в `Xover/Assets.xcassets/AppIcon.appiconset/`
3. Пересоберите

---

## 🛠 Технические детали

### Что внутри backend-bundle:
- ✅ Node.js v22 runtime (~35MB)
- ✅ Оптимизированные production зависимости (~40MB)
- ✅ Backend исходники (~1MB)
- ✅ SQLite (встроенная БД)
- ❌ Удалены: README, LICENSE, тесты, .yml файлы, документация

### Переменные окружения:
- `NODE_ENV=production`
- `PORT=3001` (или из настроек)
- `DB_TYPE=sqlite`
- `DB_PATH=~/Library/Application Support/com.hostprint.Xover/hostprint.db`
- `JWT_SECRET=<автогенерируется>`

### Размер приложения:
- Приложение: ~2-3 MB
- Backend bundle (оптимизирован): ~41 MB
- Итого: **~43-45 MB** (вместо ~160MB)

---

## 🎉 Готово!

Теперь у вас есть:
- ✅ Полностью автономное macOS приложение
- ✅ Встроенный Node.js runtime
- ✅ SQLite база данных
- ✅ Автозапуск backend при старте
- ✅ Оптимизированный размер (~45MB)
- ✅ Один клик для запуска

**Больше не нужно трогать Xcode!** Просто дважды кликните на Xover.app 🚀

---

## 📞 Поддержка

Если что-то не работает:
1. Посмотрите логи: Console.app → фильтр "Xover" или "Backend"
2. Проверьте `FIX_BUILD.md` для решения проблем сборки
3. Проверьте `EMBED_BACKEND.md` для детальной диагностики
4. Пересоздайте bundle: `./bundle-backend.sh`
