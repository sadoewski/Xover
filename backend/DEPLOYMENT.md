# Инструкция по деплою на продакшн сервер

## Проблема

На продакшн сервере база данных не синхронизирована с кодом приложения. Отсутствуют некоторые колонки в таблицах, что вызывает ошибки типа:

```
error: column "updated_at" does not exist
```

## Решение

Создана система миграций, которая автоматически добавит все недостающие колонки и индексы.

## Шаги для деплоя

### 1. Подключитесь к продакшн серверу

```bash
ssh user@your-server
cd /path/to/hostprint/backend
```

### 2. Создайте бэкап базы данных (ОБЯЗАТЕЛЬНО!)

```bash
# Замените DB_NAME, DB_USER на ваши значения
pg_dump -U DB_USER -d DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Запустите миграции

```bash
npm run db:migrate:all
```

Эта команда:
- Проверит какие миграции уже выполнены
- Выполнит только новые миграции
- Создаст все недостающие колонки и индексы
- Добавит триггеры для автоматического обновления `updated_at`

### 4. Проверьте результат

После выполнения миграций вы увидите:

```
✅ Все миграции успешно выполнены!

📊 Таблицы в базе данных:
   - users
   - priorities
   - task_groups
   - task_group_types
   - tasks
   - task_logs
   - events
   - event_year_notes
   - datatasks
   - datatask_dates
   - schema_migrations
```

### 5. Перезапустите приложение

```bash
# Если используется PM2
pm2 restart backend

# Или если используется systemd
sudo systemctl restart hostprint-backend

# Или через Docker
docker-compose restart backend
```

### 6. Проверьте работу

```bash
# Проверьте логи
pm2 logs backend
# или
docker logs hostprint-backend-1

# Проверьте API
curl http://localhost:5001/health
```

## Что делает миграция 009_comprehensive_sync.sql

Эта миграция добавляет все недостающие колонки в таблицы:

### events
- ✅ `updated_at` - для отслеживания изменений
- ✅ Все необходимые колонки (`type`, `name`, `description`, `month`, `day`, `date`, `is_day_off`, `is_yearly`)

### event_year_notes  
- ✅ `updated_at` - для отслеживания изменений
- ✅ `user_id` - для связи с пользователем

### tasks
- ✅ `datatask_id` - для связи с datatasks
- ✅ Все колонки для статусов, чек-листов, связей
- ✅ `time_slot_start`, `time_slot_end`, `is_time_bound`

### datatasks и datatask_dates
- ✅ Создает таблицы если их нет
- ✅ Все необходимые колонки и индексы

### Индексы
- ✅ Добавляет индексы для оптимизации запросов
- ✅ GIN индексы для JSONB колонок

### Триггеры
- ✅ Автоматическое обновление `updated_at` при изменении записей

## Восстановление из бэкапа (если что-то пошло не так)

```bash
# Восстановить базу из бэкапа
psql -U DB_USER -d DB_NAME < backup_YYYYMMDD_HHMMSS.sql
```

## Проверка синхронизации

После миграции проверьте что все колонки на месте:

```sql
-- Подключитесь к базе
psql -U DB_USER -d DB_NAME

-- Проверьте колонки таблицы events
\d events

-- Должны быть:
-- - created_at
-- - updated_at
-- - type
-- - name
-- - description
-- - month
-- - day
-- - date
-- - is_day_off
-- - is_yearly
```

## Частые проблемы и решения

### Ошибка: "column already exists"
Это нормально - миграция использует `ADD COLUMN IF NOT EXISTS`, так что безопасно запускать повторно.

### Ошибка: "permission denied"
Убедитесь что у пользователя БД есть права на ALTER TABLE:

```sql
GRANT ALL PRIVILEGES ON DATABASE DB_NAME TO DB_USER;
```

### Ошибка: "relation does not exist"
Сначала выполните базовую миграцию:

```bash
npm run db:migrate
```

Затем запустите все миграции:

```bash
npm run db:migrate:all
```

## Мониторинг после деплоя

Следите за логами первые несколько часов:

```bash
# PM2
pm2 logs backend --lines 100

# Docker
docker logs -f hostprint-backend-1 --tail 100
```

Проверяйте на наличие ошибок типа:
- `column "xxx" does not exist`
- `relation "xxx" does not exist`  
- `constraint "xxx" already exists`

Если все работает без ошибок - деплой успешен! ✅
