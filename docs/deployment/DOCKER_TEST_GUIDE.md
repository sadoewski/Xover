# Инструкция по тестированию через Docker Compose

## Локальное тестирование - ✅ ПРОЙДЕНО

Я провел полное тестирование локальной базы данных:

```
✅ БД подключена
✅ Все 9 таблиц созданы
✅ Все критичные колонки на месте
✅ Создание задач работает
✅ Создание событий работает  
✅ Создание datatasks работает
```

**Все тесты прошли успешно! База данных полностью синхронизирована.**

## Тестирование через Docker Compose

Для полного теста через Docker выполни следующие команды:

### 1. Останови текущие контейнеры (если запущены)

```bash
docker-compose down
```

### 2. Пересобери контейнеры с новыми миграциями

```bash
docker-compose build --no-cache backend
```

### 3. Запусти все сервисы

```bash
docker-compose up -d
```

### 4. Проверь логи бэкенда

```bash
docker-compose logs backend
```

Должен увидеть:
```
✓ Сервер запущен на порту 5000
✓ API доступно по адресу: http://localhost:5000
```

### 5. Проверь что миграции выполнились

```bash
docker-compose exec backend npm run db:migrate:all
```

Должно показать что все миграции уже выполнены.

### 6. Запусти тесты внутри контейнера

```bash
docker-compose exec backend node test-api.js
```

Должны пройти все тесты как в локальной версии.

### 7. Проверь API endpoints вручную

#### Регистрация пользователя:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "name": "Test User",
    "email": "test@test.com"
  }'
```

Должен вернуть токен и данные пользователя.

#### Сохрани токен из ответа и используй для следующих запросов:
```bash
TOKEN="your_token_here"
```

#### Создание приоритета:
```bash
curl -X POST http://localhost:5000/api/priorities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Высокий",
    "color": "#ff0000",
    "level": 1
  }'
```

#### Создание группы:
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Работа",
    "color": "#0000ff",
    "description": "Рабочие задачи"
  }'
```

#### Создание задачи (ВАЖНЫЙ ТЕСТ - проверяет camelCase → snake_case):
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Тестовая задача",
    "description": "Проверка API",
    "groupId": 1,
    "priorityId": 1,
    "date": "2026-10-05",
    "isTimeBound": true,
    "timeSlotStart": "10:00:00",
    "timeSlotEnd": "11:00:00"
  }'
```

**Если этот запрос проходит без ошибок - значит всё работает!**

#### Создание события (ВАЖНЫЙ ТЕСТ - проверяет isDayOff → is_day_off):
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "birthday",
    "name": "День рождения",
    "description": "Тест",
    "month": 10,
    "day": 5,
    "date": "2026-10-05",
    "isDayOff": true,
    "isYearly": true
  }'
```

**Если вернулся объект с updated_at - значит миграция сработала!**

### 8. Проверь фронтенд

Открой в браузере: http://localhost:3000

1. Зарегистрируйся/войди
2. Создай приоритет
3. Создай группу
4. Создай задачу с временем
5. Создай событие

### Возможные ошибки и решения

#### Ошибка: "column 'updated_at' does not exist"
**Решение:** Миграции не выполнились. Запусти:
```bash
docker-compose exec backend npm run db:migrate:all
docker-compose restart backend
```

#### Ошибка: "relation 'datatasks' does not exist"
**Решение:** База не инициализирована. Запусти:
```bash
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:migrate:all
docker-compose restart backend
```

#### Ошибка при запуске миграций
**Решение:** Очисти БД и пересоздай:
```bash
docker-compose down -v
docker-compose up -d
```

### Проверка логов в реальном времени

```bash
# Все логи
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только БД
docker-compose logs -f db
```

## Чеклист перед продакшн деплоем

- [ ] `docker-compose up -d` запускается без ошибок
- [ ] Миграции выполняются автоматически при старте
- [ ] Тестовый юзер может зарегистрироваться
- [ ] API создания задач работает (с camelCase полями)
- [ ] API создания событий работает (с isDayOff)
- [ ] Фронтенд открывается и подключается к API
- [ ] Нет ошибок типа "column does not exist" в логах

## Готово! 🎉

Если все тесты прошли - можно деплоить на продакшн сервер!
