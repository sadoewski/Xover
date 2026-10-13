# Changelog - Xover

## [Unreleased] - 2024-10-05

### 🐛 Критическое исправление: DELETE запросы на деплое

#### Fixed
- **Исправлена проблема с удалением элементов на продакшн деплое**
  - DELETE запросы теперь корректно проксируются через Nginx
  - Добавлена обработка OPTIONS preflight запросов для CORS
  - Явное разрешение HTTP методов: GET, POST, PUT, DELETE, PATCH, OPTIONS
  - Правильные CORS заголовки на backend и frontend
  - Увеличены таймауты и размеры буферов для nginx proxy

#### Changed
- **frontend/nginx.conf**:
  - Добавлена обработка OPTIONS запросов
  - Добавлено явное разрешение методов через `proxy_method`
  - Добавлены все необходимые proxy заголовки (X-Real-IP, X-Forwarded-For, etc)
  - Увеличен `client_max_body_size` до 50MB
  - Добавлены таймауты (60s) для долгих запросов
  - Добавлен отдельный location для /uploads
  
- **backend/src/index.js**:
  - Явное указание разрешённых методов в CORS middleware
  - Добавлены `allowedHeaders` и `exposedHeaders`
  - Добавлен `maxAge: 600` для кэширования preflight запросов
  - Добавлено логирование DELETE/PUT/PATCH запросов в dev режиме

#### Added
- **test-delete.sh** - скрипт для тестирования DELETE запросов:
  - Тест OPTIONS preflight запроса
  - Тест DELETE на несуществующий ресурс (404)
  - Тест создания и удаления реального приоритета
  - Проверка CORS заголовков
  - Автоматическая авторизация
  - Цветной вывод результатов
  
- **DELETE_FIX.md** - полная документация по проблеме и решению:
  - Описание проблемы и причин
  - Пошаговая инструкция по применению исправления
  - Инструкции для Docker и обычного деплоя
  - Методы проверки через DevTools и curl
  - Альтернативные решения (POST с _method, X-HTTP-Method-Override)
  - Известные проблемы хостингов (Cloudflare, AWS, shared hosting)
  - Контрольный чеклист
  - Troubleshooting guide

#### Technical Details
Проблема возникала из-за того, что Nginx по умолчанию не проксирует DELETE/PUT/PATCH запросы 
без явного указания разрешённых методов. Кроме того, отсутствовала обработка OPTIONS preflight 
запросов, которые браузер отправляет перед DELETE для проверки CORS политики.

---

None currently! 🎉

---

### 📝 Notes

- App requires macOS 11.0+ (Big Sur)
- Web Inspector requires macOS 13.3+ (Ventura)
- HTTP connections only to whitelisted domains
- Icon cache may require manual refresh (use `refresh-icon.sh`)

---

### 👥 Contributors

- [@sadoewski](https://github.com/sadoewski)

---

### 📄 License

[Your License Here]

---

**Commit**: `b95a4d8`  
**Date**: 2026-10-05  
**Files Changed**: 31 files (+1391, -50)
