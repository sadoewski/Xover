# 🔄 Xover Mode Switching Guide

Приложение Xover может работать в двух режимах:

## 📡 Remote Mode (Production)

Подключение к продакшн-серверу: `http://179.255.187.191:3000`

### Переключиться на remote:

```bash
cd /Users/sadoewski/projects/hostprint/macos-app
./switch-mode.sh remote
```

Затем в Xcode:
- **Cmd+B** — пересобрать
- **Cmd+R** — запустить

### Особенности:
- ✅ Не нужно запускать локальные backend/frontend
- ✅ Работает с реальными данными на сервере
- ✅ Backend auto-start отключён
- ⚠️ Требуется интернет

---

## 💻 Local Mode (Development)

Локальная разработка с backend на порту 5001 и frontend на 5173.

### Переключиться на local:

```bash
cd /Users/sadoewski/projects/hostprint/macos-app
./switch-mode.sh local
```

Скрипт автоматически запустит:
- Backend на `http://localhost:5001`
- Frontend на `http://localhost:5173`

Затем в Xcode:
- **Cmd+B** — пересобрать
- **Cmd+R** — запустить

### Особенности:
- ✅ Полный контроль над кодом
- ✅ Hot reload для frontend
- ✅ Backend auto-start включён
- ✅ Локальная SQLite база
- 🔧 Нужно запустить backend и frontend

---

## 🎯 Быстрый старт

### Remote mode (сейчас активен):
```bash
# Просто открой Xcode и запусти (Cmd+R)
open Xover.xcodeproj
```

### Local mode:
```bash
# Запустить все сервисы и открыть Xcode
~/run-xover-full.sh
```

---

## 🛠 Текущие настройки

Проверить текущий режим:
```bash
defaults read com.xover.desktop serverURL
defaults read com.xover.desktop autoStartBackend
```

Сбросить настройки:
```bash
defaults delete com.xover.desktop serverURL
defaults delete com.xover.desktop autoStartBackend
```

---

## 📊 Порты

| Сервис | Порт | Режим |
|--------|------|-------|
| Production Server | 3000 | Remote |
| Local Backend (API) | 5001 | Local |
| Local Frontend (UI) | 5173 | Local |

---

## 🔍 Troubleshooting

### Приложение показывает белый экран:
1. Проверь что сервер доступен:
   ```bash
   curl -I http://179.255.187.191:3000
   ```
2. Пересобери приложение: **Cmd+Shift+K** → **Cmd+B**

### Backend не запускается в local mode:
```bash
# Проверь логи
tail -f /tmp/xover-backend.log

# Перезапусти вручную
cd /Users/sadoewski/projects/hostprint/backend
npm run dev
```

### Frontend не запускается в local mode:
```bash
# Проверь логи
tail -f /tmp/xover-frontend.log

# Перезапусти вручную
cd /Users/sadoewski/projects/hostprint/frontend
npm run dev
```

---

**Current mode: REMOTE** ✅
