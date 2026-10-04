# 🚀 Запуск проекта через Docker Compose

## Одна команда - всё работает!

```bash
docker-compose up -d
```

Вот и всё! Проект запущен на:
- 🌐 **Frontend:** http://localhost:3000
- 🔌 **Backend API:** http://localhost:5000
- 🗄️ **PostgreSQL:** localhost:5432

## Проверка

```bash
# Статус контейнеров
docker-compose ps

# Логи (следить в реальном времени)
docker-compose logs -f

# Проверка API
curl http://localhost:5000/health
```

## Что происходит автоматически

1. ✅ **PostgreSQL запускается** и создаёт БД `hostprint`
2. ✅ **Backend** ждёт готовности БД
3. ✅ **Миграции выполняются автоматически** (`npm run db:migrate:all`)
4. ✅ **API сервер запускается** на порту 5000
5. ✅ **Frontend собирается** и запускается на порту 3000
6. ✅ **Nginx проксирует** `/api` → backend

## Миграции

Миграции запускаются **автоматически** при старте backend.

Проверить выполненные миграции:
```bash
docker-compose exec backend npm run db:migrate:all
```

Вывод покажет:
```
⏭️  Пропускаем 004_create_rwprint_schema.sql (уже выполнена)
⏭️  Пропускаем 007_create_sites.sql (уже выполнена)
⏭️  Пропускаем 008_sync_schema.sql (уже выполнена)
⏭️  Пропускаем 009_comprehensive_sync.sql (уже выполнена)

✅ Все миграции успешно выполнены!
```

## Создание пользователя

Через API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "name": "Admin User",
    "email": "admin@example.com"
  }'
```

Или через фронтенд:
1. Открой http://localhost:3000
2. Нажми "Регистрация"
3. Заполни форму

## Остановка

```bash
# Остановить всё
docker-compose down

# Остановить и удалить данные БД
docker-compose down -v
```

## Перезапуск

```bash
# Перезапустить всё
docker-compose restart

# Перезапустить только backend
docker-compose restart backend

# Пересобрать и запустить
docker-compose up -d --build
```

## Логи

```bash
# Все логи
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend  
docker-compose logs -f frontend

# Последние 50 строк
docker-compose logs --tail=50 backend
```

## Отладка

```bash
# Зайти в контейнер backend
docker-compose exec backend sh

# Зайти в БД
docker-compose exec db psql -U postgres -d hostprint

# Запустить тесты
docker-compose exec backend node test-api.js
```

## Проблемы?

### Backend не запускается
```bash
# Смотрим логи
docker-compose logs backend

# Проверяем БД
docker-compose ps db

# Запускаем миграции вручную
docker-compose exec backend npm run db:migrate:all
docker-compose restart backend
```

### Frontend не работает
```bash
# Логи
docker-compose logs frontend

# Пересобрать
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Ошибка "column does not exist"
```bash
# Миграции не выполнились - запусти вручную:
docker-compose exec backend npm run db:migrate:all
docker-compose restart backend
```

### Порты заняты
```bash
# Проверь что порты свободны
lsof -i :3000
lsof -i :5000
lsof -i :5432

# Или измени порты в docker-compose.yml
```

## Документация

- 📘 **DOCKER_DEPLOY.md** - полное руководство по Docker
- 📗 **DOCKER_COMMANDS.md** - быстрый справочник команд
- 📕 **SYNC_DATABASE.md** - синхронизация БД на проде
- 📙 **README_TEST_RESULTS.md** - результаты тестов

## Тестирование перед деплоем

```bash
# Запусти проверку
./test-docker.sh

# Должен вывести:
# ✅ Все проверки пройдены!
```

## Production deployment

На продакшн сервере:

```bash
# 1. Клонируй репо или подтяни изменения
git pull origin main

# 2. Измени JWT_SECRET и DB_PASSWORD в docker-compose.yml

# 3. Запусти
docker-compose up -d

# 4. Проверь логи
docker-compose logs -f backend

# 5. Должен увидеть:
# ✅ Все миграции успешно выполнены!
# ✓ Сервер запущен на порту 5000
```

## 🎉 Готово!

Проект работает! Открой http://localhost:3000 и пользуйся!

---

**Нужна помощь?** Смотри **DOCKER_DEPLOY.md** для детальной информации.
