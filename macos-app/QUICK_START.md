# 🚀 Быстрый старт: Создание standalone macOS приложения

## Всего 3 шага для создания полностью автономного .app

### 📦 Шаг 1: Добавить backend-bundle в Xcode (ОДИН РАЗ)

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

### 🔨 Шаг 2: Собрать приложение

В Xcode:
```
⌘⇧K  (Clean Build Folder)
⌘B   (Build)
```

Или из терминала в этой папке:
```bash
# Если нужно пересоздать backend-bundle
./bundle-backend.sh

# Затем соберите в Xcode
```

### 📲 Шаг 3: Установить в Applications

```bash
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
- **Backend bundle**: `/Users/sadoewski/projects/hostprint/macos-app/backend-bundle/`
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
- ✅ Node.js v22 runtime (~100MB)
- ✅ Все production зависимости
- ✅ Backend исходники
- ✅ SQLite (встроенная БД)

### Переменные окружения:
- `NODE_ENV=production`
- `PORT=3001` (или из настроек)
- `DB_TYPE=sqlite`
- `DB_PATH=~/Library/Application Support/com.hostprint.Xover/hostprint.db`
- `JWT_SECRET=<автогенерируется>`

### Размер приложения:
- Приложение: ~2-3 MB
- Backend bundle: ~150 MB
- Итого: **~150-160 MB**

---

## 📞 Поддержка

Если что-то не работает:
1. Посмотрите логи: Console.app → фильтр "Xover" или "Backend"
2. Проверьте `EMBED_BACKEND.md` для детальной диагностики
3. Пересоздайте bundle: `./bundle-backend.sh`

---

**Готово к работе!** Теперь у вас полностью автономное macOS приложение 🎉
