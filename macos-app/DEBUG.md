# 🐛 Xover Debugging Guide

## Исправлена проблема с HTTP соединениями

**Проблема**: macOS блокировал незащищённые HTTP соединения из-за App Transport Security (ATS).

**Решение**: Добавлена конфигурация ATS в `Info.plist`:
- Разрешены HTTP соединения к `179.255.187.191`
- Разрешены HTTP соединения к `localhost`

---

## Шаги для запуска после изменений:

### 1. **Clean Build** (обязательно!)
В Xcode: **Cmd+Shift+K** или Product → Clean Build Folder

### 2. **Rebuild**
В Xcode: **Cmd+B** или Product → Build

### 3. **Run**
В Xcode: **Cmd+R** или Product → Run

---

## Просмотр логов

Логи теперь содержат детальную информацию:
- 🌐 Loading URL: ... (начало загрузки)
- ✅ Finished loading: ... (успешная загрузка)
- ❌ Navigation failed: ... (ошибка)
- 🔒 App Transport Security blocked (если ATS блокирует)

### Просмотр в Xcode Console:
- **Cmd+Shift+Y** — показать/скрыть консоль
- Фильтр: введите "Xover" для показа только логов приложения

### Просмотр в Console.app:
```bash
open -a Console
```
Фильтр: `process:Xover`

---

## Web Inspector для отладки WebView

Теперь включён Web Inspector (Safari DevTools):

1. Запусти приложение Xover
2. Открой Safari
3. Safari → Develop → [Your Mac Name] → Xover

Там увидишь:
- Console (ошибки JavaScript)
- Network (запросы к API)
- Elements (DOM)

---

## Проверка соединения

### Из терминала:
```bash
# Проверить доступность сервера
curl -I http://179.255.187.191:3000

# Проверить что HTML отдаётся
curl -s http://179.255.187.191:3000 | head -20

# Проверить текущие настройки приложения
defaults read com.xover.desktop serverURL
defaults read com.xover.desktop autoStartBackend
```

### Из браузера:
Открой http://179.255.187.191:3000 — должна открыться страница Xover.

---

## Типичные ошибки

### "App Transport Security blocked"
- **Причина**: Info.plist не содержит исключение для HTTP
- **Решение**: Уже исправлено, сделай Clean Build + Rebuild

### "Cannot connect to host"
- **Причина**: Сервер недоступен или проблема с интернетом
- **Проверка**: `curl -I http://179.255.187.191:3000`

### "Cannot find host"
- **Причина**: DNS не резолвит IP (редко для IP адресов)
- **Проверка**: `ping 179.255.187.191`

### Белый экран без ошибок
- **Причина**: JavaScript не загружается или падает
- **Решение**: Открой Web Inspector (Safari → Develop → Xover)

---

## Сброс настроек

Если что-то пошло не так:

```bash
# Удалить все настройки приложения
defaults delete com.xover.desktop

# Удалить кэши WebKit
rm -rf ~/Library/WebKit/com.xover.desktop
rm -rf ~/Library/Caches/com.xover.desktop

# Пересобрать в Xcode: Cmd+Shift+K → Cmd+B → Cmd+R
```

---

## Текущая конфигурация

- **Server URL**: `http://179.255.187.191:3000`
- **Backend Auto-Start**: `false` (remote mode)
- **ATS Exceptions**: `179.255.187.191`, `localhost`
- **Web Inspector**: Включён
- **Request Timeout**: 30 секунд
- **Cache Policy**: Reload ignoring cache

---

## Следующие улучшения

Если всё заработает, можно добавить:

1. **HTTPS поддержка** (Let's Encrypt на сервере)
2. **Offline mode** (Service Worker + local cache)
3. **Auto-reconnect** при потере соединения
4. **Better error UI** с кнопками действий

---

**Важно**: После каждого изменения Info.plist делай **Clean Build** (Cmd+Shift+K)!
