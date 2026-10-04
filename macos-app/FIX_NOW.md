# ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ ОШИБКИ СБОРКИ

## Проблема
Xcode копирует все файлы из `backend-bundle`, включая дубликаты (README.md, LICENSE и т.д. из каждого пакета node_modules), что вызывает ошибки "Multiple commands produce".

## ✅ Решение (3 шага)

### Шаг 1: Удалите backend-bundle из Xcode проекта

1. Откройте `Xover.xcodeproj` в Xcode
2. В левой панели (Project Navigator) найдите **backend-bundle** (синяя папка 📁)
3. **Кликните правой кнопкой** на `backend-bundle`
4. Выберите **"Delete"**
5. В диалоге выберите **"Remove Reference"** (НЕ "Move to Trash")

### Шаг 2: Добавьте Build Phase скрипт

1. В Xcode выберите проект **Xover** (в самом верху Project Navigator)
2. Выберите Target **Xover**
3. Перейдите на вкладку **"Build Phases"**
4. Нажмите **"+"** → **"New Run Script Phase"**
5. Переименуйте фазу в **"Copy Backend Bundle"** (дважды кликните на название)
6. **ПЕРЕТАЩИТЕ** эту фазу так, чтобы она была **ВЫШЕ "Copy Bundle Resources"**
7. В текстовое поле скрипта вставьте:

```bash
"${PROJECT_DIR}/copy-backend-script.sh"
```

8. Разверните фазу и установите:
   - ✅ "Show environment variables in build log" (опционально)
   - ✅ Оставьте "Based on dependency analysis" как есть

### Шаг 3: Clean и Build

1. **⌘⇧K** (Product → Clean Build Folder)
2. **⌘B** (Product → Build)

Готово! ✅

---

## Что делает скрипт?

Скрипт `copy-backend-script.sh` копирует только нужные файлы из backend-bundle, исключая:
- Документацию (README, LICENSE, CHANGELOG)
- Тесты и примеры
- Конфигурационные файлы (.yml, .gyp, Dockerfile)
- TypeScript файлы (.ts, .d.ts)
- Дубликаты из node_modules

Размер итогового bundle уменьшается и конфликты исчезают.

---

## Проверка

После успешной сборки проверьте:

```bash
ls -la ~/Library/Developer/Xcode/DerivedData/*/Build/Products/Debug/Xover.app/Contents/Resources/backend-bundle/
```

Должны увидеть:
- ✅ `nodejs/` - Node.js runtime
- ✅ `node_modules/` - зависимости
- ✅ `src/` - исходники backend
- ✅ `package.json`
- ❌ Никаких README.md или LICENSE файлов

---

## Если что-то пошло не так

### Backend bundle не копируется

Проверьте права на скрипт:
```bash
ls -l /Users/sadoewski/projects/hostprint/macos-app/copy-backend-script.sh
```

Должно быть `-rwxr-xr-x` (исполняемый). Если нет:
```bash
chmod +x /Users/sadoewski/projects/hostprint/macos-app/copy-backend-script.sh
```

### Всё ещё ошибки

Попробуйте полностью очистить DerivedData:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/Xover-*
```

Затем в Xcode: ⌘⇧K → ⌘B

---

## После успешной сборки

```bash
cd /Users/sadoewski/projects/hostprint/macos-app
./install-app.sh
open /Applications/Xover.app
```

🎉 Приложение готово к использованию!
