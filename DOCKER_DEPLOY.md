# 🐳 Docker Compose Deployment Guide

## ✅ Готово к запуску

Проект полностью настроен для запуска через Docker Compose.

## Быстрый старт

```bash
# 1. Запуск всех сервисов
docker-compose up -d

# 2. Проверка статуса
docker-compose ps

# 3. Просмотр логов
docker-compose logs -f

# 4. Проверка что всё работает
curl http://localhost:5000/health
curl http://localhost:3000
```

## Что происходит при запуске

### 1. База данных (PostgreSQL)
- Запускается первой
- Создаётся БД `hostprint`
- Healthcheck проверяет готовность
- Порт: `5432`

### 2. Backend (Node.js + Express)
- Ждёт готовности БД (depends_on + healthcheck)
- **Автоматически запускает миграции:** `npm run db:migrate:all`
- Применяет все миграции из `migrations/` папки
- Запускает API сервер
- Порт: `5000`

### 3. Frontend (React + Vite + Nginx)
- Собирается production build
- Настроен nginx для проксирования `/api` → backend
- Порт: `3000` (80 внутри контейнера)

## Проверка миграций

```bash
# Посмотреть какие миграции выполнены
docker-compose exec backend node -e "
import pool from './src/config/database.js';
(async () => {
  const result = await pool.query('SELECT * FROM schema_migrations ORDER BY id');
  console.table(result.rows);
  await pool.end();
})();
"

# Или через psql
docker-compose exec db psql -U postgres -d hostprint -c "SELECT * FROM schema_migrations;"
```

## Структура проекта в Docker

```
hostprint/
├── docker-compose.yml          # Оркестрация всех сервисов
├── backend/
│   ├── Dockerfile              # ✅ Обновлён
│   ├── migrations/             # ✅ Копируется в контейнер
│   │   ├── 004_create_rwprint_schema.sql
│   │   ├── 007_create_sites.sql
│   │   ├── 008_sync_schema.sql
│   │   └── 009_comprehensive_sync.sql
│   ├── run-migrations.js       # ✅ Копируется в контейнер
│   ├── src/                    # Исходный код
│   └── package.json
└── frontend/
    ├── Dockerfile              # Multi-stage build
    ├── nginx.conf              # ✅ Проксирует /api
    ├── .env.production         # ✅ VITE_API_URL=/api
    └── src/
```

## Переменные окружения

### Backend
```yaml
NODE_ENV: production
PORT: 5000
DB_HOST: db                    # Имя сервиса в docker-compose
DB_PORT: 5432
DB_NAME: hostprint
DB_USER: postgres
DB_PASSWORD: postgres
JWT_SECRET: (длинный секрет)
JWT_EXPIRES_IN: 7d
ALLOWED_ORIGINS: http://localhost:3000,http://localhost:5173
```

### Frontend
```env
# .env.production
VITE_API_URL=/api              # Проксируется через nginx
```

## Команды для управления

### Запуск и остановка

```bash
# Запустить всё
docker-compose up -d

# Остановить всё
docker-compose down

# Остановить и удалить volumes (БД будет очищена!)
docker-compose down -v

# Перезапустить один сервис
docker-compose restart backend
docker-compose restart frontend
```

### Логи

```bash
# Все логи
docker-compose logs -f

# Логи одного сервиса
docker-compose logs -f backend
docker-compose logs -f db
docker-compose logs -f frontend

# Последние 100 строк
docker-compose logs --tail=100 backend
```

### Пересборка

```bash
# Пересобрать всё
docker-compose build

# Пересобрать без кеша (если что-то сломалось)
docker-compose build --no-cache

# Пересобрать и запустить
docker-compose up -d --build
```

### Выполнение команд внутри контейнера

```bash
# Запустить bash в backend
docker-compose exec backend sh

# Выполнить миграции вручную
docker-compose exec backend npm run db:migrate:all

# Запустить тесты
docker-compose exec backend node test-api.js

# Подключиться к БД
docker-compose exec db psql -U postgres -d hostprint
```

## Проверка работоспособности

### 1. Проверка контейнеров

```bash
docker-compose ps
```

Должно быть:
```
NAME                    STATUS              PORTS
hostprint-backend       Up                  0.0.0.0:5000->5000/tcp
hostprint-db            Up (healthy)        0.0.0.0:5432->5432/tcp
hostprint-frontend      Up                  0.0.0.0:3000->80/tcp
```

### 2. Проверка API

```bash
# Health check
curl http://localhost:5000/health

# Должен вернуть:
# {"status":"ok","message":"API работает"}
```

### 3. Проверка фронтенда

```bash
# Открой в браузере
open http://localhost:3000

# Или через curl
curl -I http://localhost:3000
```

### 4. Проверка что миграции выполнились

```bash
# Посмотреть логи backend при старте
docker-compose logs backend | grep "миграц"

# Должно быть:
# ✓ 004_create_rwprint_schema.sql выполнена успешно
# ✓ 007_create_sites.sql выполнена успешно
# ✓ 008_sync_schema.sql выполнена успешно
# ✓ 009_comprehensive_sync.sql выполнена успешно
# ✅ Все миграции успешно выполнены!
```

### 5. Создание тестового пользователя

```bash
# Регистрация через API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "password": "test123",
    "name": "Test User",
    "email": "test@test.com"
  }'

# Должен вернуть токен и данные пользователя
```

## Типичные проблемы и решения

### Проблема: Backend не запускается

```bash
# Смотрим логи
docker-compose logs backend

# Возможные причины:
# 1. БД не готова - проверь healthcheck
docker-compose logs db

# 2. Миграции не выполнились - запусти вручную
docker-compose exec backend npm run db:migrate:all
```

### Проблема: Frontend не собирается

```bash
# Смотрим логи сборки
docker-compose logs frontend

# Пересобрать с нуля
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Проблема: "Connection refused" от БД

```bash
# Проверь что БД запущена и healthy
docker-compose ps db

# Если не healthy - подожди или перезапусти
docker-compose restart db
```

### Проблема: Порты заняты

```bash
# Проверь какие порты заняты
lsof -i :5000
lsof -i :3000
lsof -i :5432

# Останови процессы или измени порты в docker-compose.yml
```

### Проблема: "column does not exist"

```bash
# Значит миграции не выполнились
# Запусти вручную:
docker-compose exec backend npm run db:migrate:all

# Перезапусти backend
docker-compose restart backend
```

## Очистка и сброс

```bash
# Полная очистка (удалит ВСЁ включая данные!)
docker-compose down -v

# Удалить образы
docker-compose down --rmi all

# Удалить всё и пересобрать
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Production deployment

Для продакшн сервера:

1. Измени переменные окружения в `docker-compose.yml`:
   - `JWT_SECRET` - используй сильный секрет
   - `DB_PASSWORD` - используй сильный пароль
   - `ALLOWED_ORIGINS` - укажи реальный домен

2. Используй docker-compose.prod.yml:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. Настрой reverse proxy (nginx/traefik) перед контейнерами

4. Используй volumes для персистентности данных

## Мониторинг

```bash
# Статистика по ресурсам
docker stats

# Размер образов
docker-compose images

# Использование места
docker system df
```

## 🎉 Готово!

Теперь проект запускается одной командой:
```bash
docker-compose up -d
```

И всё работает! 🚀
