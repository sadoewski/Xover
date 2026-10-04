# Refactor Progress Tracker

## Этап 0: Baseline ✅ ЗАВЕРШЕН
- ✅ Создан docs/architecture-baseline.md
- ✅ Зафиксировано текущее состояние системы
- ✅ Перечислены все известные дефекты

## Этап 1: Единая система миграций ✅ ЗАВЕРШЕН

### Выполненные задачи:
1. ✅ Создан migrate.js с таблицей schema_migrations
2. ✅ Создана единая директория backend/migrations/
3. ✅ Созданы упорядоченные миграции:
   - 001_initial_schema.sql — core tables
   - 002_add_datatasks.sql — datatasks, datatask_dates, tasks.datatask_id
   - 003_add_task_relations.sql — task_relations table
   - 004_add_rwprint.sql — RWPrint schema с file_size
   - 005_add_sites.sql — sites, site_items
4. ✅ Удален runtime DDL из datatasksController.js
5. ✅ Обновлен package.json: db:migrate → node migrate.js
6. ✅ Удалены старые директории миграций (src/migrations, старые migrations)

### Критерии приёмки:
- ✅ Единая директория migrations/
- ✅ Версионирование миграций
- ✅ Таблица schema_migrations
- ✅ Транзакционное выполнение
- ✅ Защита от повторного выполнения
- ✅ Нет runtime DDL в controllers
- ⏳ Тестирование: clean database bootstrap (СЛЕДУЮЩИЙ ШАГ)

---

## Этап 2: Package Lock Files (P0)

### Текущий статус:
- ✅ package-lock.json существует в корне
- ❓ backend/package-lock.json — нужно проверить
- ❓ frontend/package-lock.json — нужно проверить
- ✅ .gitignore НЕ блокирует package-lock.json

### Задачи:
- [ ] Создать package-lock.json для backend
- [ ] Создать package-lock.json для frontend
- [ ] Обновить Dockerfiles: npm install → npm ci

---

## Этап 3: Frontend API Layer (P0) — КРИТИЧНО

### Проблемы:
- ❌ Hardcoded localhost:5001 в 10+ местах
- ❌ Frontend напрямую вызывает axios в компонентах
- ❌ Нет единого baseURL

### Файлы с проблемами:
```
frontend/src/components/ProfessionalLayout.jsx
frontend/src/components/UserProfileModal.jsx
frontend/src/pages/DataTaskDetailPage.jsx (3x)
frontend/src/pages/DataTasksPage.jsx (2x)
frontend/src/pages/CreateDataTaskPage.jsx (2x)
```

### План:
1. Создать api.js с единым axios instance
2. Создать/обновить services для всех модулей
3. Заменить прямые axios calls в компонентах на вызовы services
4. Добавить VITE_API_URL в .env
5. Обновить vite.config.js с proxy для dev режима

---

## Этап 4: Authorization (P0) — КРИТИЧНО

### Текущая ситуация:
- ❌ IDOR vulnerability: User A может читать ресурсы User B
- ❌ Нет tenant isolation в большинстве endpoints
- ❌ Отсутствуют authorization checks

### Затронутые модули:
- Tasks, Groups, Priorities
- Events, DataTasks
- RWPrint (environments, folders, documents, tags)
- Sites

### План:
1. Создать authorization middleware/utilities
2. Добавить user_id checks во все SELECT/UPDATE/DELETE queries
3. Написать integration tests для IDOR scenarios
4. Добавить authorization tests

---

## Этап 5: Database Constraints

### Проблемы:
1. ❌ priorities: конфликт UNIQUE(name) vs UNIQUE(user_id, name)
2. ❌ Отсутствующие NOT NULL constraints
3. ❌ Неполные CHECK constraints
4. ❌ Cascade semantics не определены для всех FK

### План:
1. Создать миграцию 006_fix_constraints.sql
2. Исправить priorities UNIQUE конфликт
3. Добавить недостающие constraints
4. Добавить DB schema tests

---

## Этап 6: Docker & Production (P0)

### Проблемы:
- ❌ PostgreSQL может быть exposed наружу
- ❌ Hardcoded secrets в репозитории (?)
- ❌ Uploads могут быть ephemeral
- ❌ Нет persistent volume strategy

### План:
1. Проверить docker-compose.yml
2. Убрать PostgreSQL external exposure
3. Добавить secrets management
4. Настроить persistent volumes для uploads
5. Добавить healthchecks

---

## Этап 7: OpenAPI Specification (P1)

### План:
1. Создать docs/openapi.yaml
2. Описать все endpoints
3. Добавить request/response schemas
4. Настроить автоматическую валидацию в CI

---

## Этап 8: Integration Tests (P1)

### План:
1. Настроить test database
2. Написать migration tests
3. Написать API integration tests
4. Написать IDOR tests
5. Написать E2E critical path tests

---

## Приоритеты выполнения

### Сейчас (P0 — блокеры):
1. ✅ Единая migration system
2. ⏳ Протестировать миграции на чистой DB
3. ⏳ Package-lock files
4. ⏳ Frontend API layer (hardcoded localhost)
5. ⏳ Authorization/IDOR fixes
6. ⏳ Docker security (PostgreSQL exposure, secrets)
7. ⏳ DB constraints fixes

### Потом (P1 — стабильность):
8. OpenAPI specification
9. Integration tests
10. Contract tests
11. E2E critical paths

### Позже (P2 — maintainability):
12. Backend refactor (controller/service/repository)
13. Frontend component decomposition
14. Logging & observability

---

## Следующий шаг

**Протестировать систему миграций:**
```bash
# Остановить и удалить существующую БД
docker compose down -v

# Запустить только PostgreSQL
docker compose up -d db

# Подождать запуска БД
sleep 5

# Запустить миграции
cd backend && npm run db:migrate

# Проверить результат
```

Если миграции пройдут успешно, переходим к:
1. Package-lock files
2. Frontend API layer (hardcoded localhost URLs)
