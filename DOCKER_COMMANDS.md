# 🐳 Быстрые команды Docker Compose

## Основные команды

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Пересборка и запуск
docker-compose up -d --build

# Полная очистка (удалит данные!)
docker-compose down -v
```

## Логи

```bash
# Все логи
docker-compose logs -f

# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Database
docker-compose logs -f db

# Последние 50 строк
docker-compose logs --tail=50 backend
```

## Проверка

```bash
# Статус контейнеров
docker-compose ps

# Health check API
curl http://localhost:5000/health

# Открыть фронтенд
open http://localhost:3000
```

## Миграции

```bash
# Запустить миграции вручную
docker-compose exec backend npm run db:migrate:all

# Посмотреть выполненные миграции
docker-compose exec db psql -U postgres -d hostprint -c "SELECT * FROM schema_migrations;"
```

## Тестирование

```bash
# Запустить тесты API
docker-compose exec backend node test-api.js

# Создать тестового пользователя
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","name":"Test","email":"test@test.com"}'
```

## Отладка

```bash
# Зайти в контейнер backend
docker-compose exec backend sh

# Зайти в БД
docker-compose exec db psql -U postgres -d hostprint

# Посмотреть таблицы
docker-compose exec db psql -U postgres -d hostprint -c "\dt"

# Посмотреть колонки таблицы events
docker-compose exec db psql -U postgres -d hostprint -c "\d events"
```

## Очистка

```bash
# Остановить всё
docker-compose down

# Удалить volumes (БД будет очищена!)
docker-compose down -v

# Пересобрать без кеша
docker-compose build --no-cache

# Удалить неиспользуемые образы
docker image prune -a
```

## Быстрая перезагрузка одного сервиса

```bash
# Backend
docker-compose restart backend

# Frontend  
docker-compose restart frontend

# Database
docker-compose restart db
```

## Одна команда - всё работает! 🚀

```bash
docker-compose up -d && docker-compose logs -f
```
