# Architecture Baseline — Hostprint

> Снимок состояния на 4 октября 2026 перед началом рефакторинга

## 1. Окружение и версии

### Версии инструментов
- **Node.js**: v22.23.2
- **npm**: 10.9.8
- **PostgreSQL**: 14.24 (Homebrew)
- **Docker**: 29.8.1
- **Docker Compose**: 5.5.1

### Структура проекта
```
hostprint/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── migrate.js
│   │   └── migrations/  (6 файлов)
│   ├── migrations/      (4 файла)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── package.json (root)
├── package-lock.json (root)
└── docker-compose.yml
```

## 2. Команды запуска

### Backend
```bash
npm run dev          # Development с nodemon
npm start            # Production
npm run db:migrate   # Миграция через migrate.js
npm run db:migrate:all # Миграция через run-migrations.js
npm test             # Jest тесты
```

### Frontend
```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run lint         # oxlint
npm test             # Vitest
```

### Docker
```bash
docker compose up --build
docker compose down -v
```

## 3. Текущая схема базы данных

### Таблицы из schema.sql
1. **users** — пользователи
   - id, username (UNIQUE), email (UNIQUE), password_hash, name, avatar_url
   - created_at, updated_at

2. **priorities** — приоритеты задач
   - id, user_id (FK), name, color, description, level
   - UNIQUE(user_id, name) + UNIQUE(name) — **КОНФЛИКТ**

3. **task_groups** — группы задач
   - id, user_id (FK), name, description, color
   - UNIQUE(user_id, name)

4. **task_group_types** — типы/подкатегории групп
   - id, group_id (FK), name, description
   - UNIQUE(group_id, name)

5. **tasks** — задачи
   - id, user_id, group_id, group_type_id, priority_id
   - title, description, date, time_slot_start, time_slot_end
   - status, status_reason, is_time_bound, is_free_time
   - checklist (JSONB), task_relations (JSONB), linked_tasks (JSONB)
   - links (JSONB), logs (JSONB)
   - moved_to_date, moved_from_date
   - **datatask_id** — упоминается в индексе, но НЕТ в схеме колонки

6. **task_logs** — логи изменений задач
   - id, task_id (FK), user_id (FK), action, old_value, new_value, details

7. **events** — события календаря
   - id, user_id (FK), type, name, description
   - month, day, date, start_time, end_time
   - color, is_day_off, is_yearly

8. **event_year_notes** — заметки к событиям по годам
   - id, event_id (FK), user_id (FK), year, note
   - UNIQUE(event_id, year)

### Таблицы из migrations (НЕ в schema.sql)

**DataTasks** (add_datatasks.sql):
- datatasks
- datatask_dates

**RWPrint** (004_create_rwprint_schema.sql):
- rwprint_environments
- rwprint_folders
- rwprint_documents
- rwprint_tags
- rwprint_document_tags
- rwprint_document_metadata

**Sites** (007_create_sites.sql):
- sites
- site_items

## 4. API Routes

### Authentication (/api/auth)
```
POST   /register
POST   /login
GET    /me
POST   /change-password
POST   /upload-avatar
PUT    /profile
```

### Groups (/api/groups)
```
GET    /
GET    /:id
POST   /
PUT    /:id
DELETE /:id
POST   /:groupId/types
DELETE /types/:id
```

### Priorities (/api/priorities)
```
GET    /
GET    /:id
POST   /
PUT    /:id
DELETE /:id
```

### Tasks (/api/tasks)
```
GET    /date/:date
GET    /:id
GET    /:id/logs
POST   /
POST   /by-ids
POST   /link
POST   /unlink
PUT    /:id
DELETE /:id
```

### Events (/api/events)
```
GET    /
GET    /:id
GET    /month/:month
GET    /date/:month/:day
POST   /
PUT    /:id
DELETE /:id
GET    /:eventId/notes
POST   /:eventId/notes
DELETE /:eventId/notes/:noteId
```

### DataTasks (/api/datatasks)
```
GET    /
GET    /:id
POST   /
PUT    /:id
DELETE /:id
POST   /:id/dates
DELETE /:id/dates/:date
PUT    /:id/dates/:date/status
```

### RWPrint (/api/rwprint)
```
GET    /environments
POST   /environments
PUT    /environments/:id
DELETE /environments/:id
GET    /environments/:environmentId/folders
POST   /environments/:environmentId/folders
PUT    /folders/:id
DELETE /folders/:id
GET    /environments/:environmentId/documents
POST   /environments/:environmentId/documents
POST   /documents/:id (для пароля)
PUT    /documents/:id
DELETE /documents/:id
GET    /environments/:environmentId/tags
POST   /environments/:environmentId/tags
DELETE /tags/:id
POST   /documents/:documentId/tags/:tagId
DELETE /documents/:documentId/tags/:tagId
GET    /documents/:documentId/tags
GET    /documents/:documentId/metadata
POST   /documents/:documentId/metadata
DELETE /documents/:documentId/metadata/:key
GET    /bookmarks
GET    /stats/storage
```

### Sites (/api/sites)
```
GET    /
GET    /:id
GET    /:id/search
POST   /
PUT    /:id
DELETE /:id
POST   /:id/items
PUT    /:id/items/:itemId
DELETE /:id/items/:itemId
```

### Morphology (/api/morphology)
```
POST   /analyze
```

### Health
```
GET    /health
```

## 5. Система миграций

### Текущая реализация

**Две директории миграций:**
1. `backend/src/migrations/` — 6 файлов
2. `backend/migrations/` — 4 файла

**Два скрипта:**
1. `backend/src/db/migrate.js` — выполняет только schema.sql
2. `backend/run-migrations.js` — не изучен

**Проблемы:**
- Нет таблицы schema_migrations
- Нет версионирования
- Нет защиты от повторного выполнения
- Нет транзакций
- Нет failure handling
- schema.sql и миграции независимы друг от друга
- Runtime DDL в datatasksController.initTables()

### Файлы миграций

**backend/src/migrations/**:
- add_datatasks.sql
- add_events.sql
- add_links_and_logs.sql
- add_task_logs.sql
- add_task_relations.sql
- update_users_auth.sql

**backend/migrations/**:
- 004_create_rwprint_schema.sql
- 007_create_sites.sql
- 008_sync_schema.sql
- 009_comprehensive_sync.sql

## 6. Переменные окружения

**backend/.env** (пример):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostprint
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 7. Frontend services

**Текущая структура:**
```
frontend/src/services/
├── authService.js
├── groupsService.js
├── prioritiesService.js
├── tasksService.js
├── eventsService.js
├── datataskService.js (?)
├── rwprintService.js (?)
└── sitesService.js
```

## 8. Production Dockerfiles

**docker-compose.yml структура:**
```yaml
services:
  db:         # PostgreSQL
  backend:    # Node.js API
  frontend:   # Vite build + serve
  nginx:      # Reverse proxy (?)
```

## 9. Известные дефекты (Discovery List)

### DEF-001: Отсутствующие lock-файлы
- ✅ package-lock.json существует в корне
- ❌ package-lock.json в .gitignore (строка отсутствует, но может быть проблема)
- ⚠️  backend/package-lock.json — нужно проверить
- ⚠️  frontend/package-lock.json — нужно проверить

### DEF-002: Несколько источников схемы БД
- backend/src/db/schema.sql
- backend/src/migrations/*.sql (6 файлов)
- backend/migrations/*.sql (4 файла)
- Runtime DDL в datatasksController

### DEF-003: Runtime DDL
- datatasksController.initTables() создает таблицы при старте приложения

### DEF-004: Отсутствующие миграции
- migrate.js выполняет только schema.sql
- Файлы в migrations/ не используются автоматически

### DEF-005: Hardcoded localhost:5001
Минимум 10 вхождений в frontend:
- ProfessionalLayout.jsx — avatar URL
- UserProfileModal.jsx — avatar preview
- DataTaskDetailPage.jsx — 3 вхождения
- DataTasksPage.jsx — 2 вхождения
- CreateDataTaskPage.jsx — 2 вхождения

### DEF-006: Дублирование /api в URL
- sitesService генерирует `/api/api/sites` (предположительно)

### DEF-007: query parameter naming inconsistency
- `q` vs `query` в разных endpoints

### DEF-008: DataTask routes несовпадение
- DELETE /:id/dates/:date vs другие варианты

### DEF-009: Отсутствующий file_size в RWPrint
- rwprint_documents.file_size упоминается в коде, но может отсутствовать в схеме

### DEF-010: event_year_notes несогласованность
- user_id и updated_at могут отсутствовать в реальной схеме vs controller

### DEF-011: Отсутствие tenant checks (Authorization)
- User A может читать/изменять ресурсы User B
- IDOR vulnerability во всех endpoints

### DEF-012: Production upload issues
- Uploads могут использовать ephemeral container filesystem
- Нет persistent storage strategy

### DEF-013: Hardcoded secrets
- JWT_SECRET в репозитории (?)
- PostgreSQL password в docker-compose.yml (?)

### DEF-014: PostgreSQL exposed
- docker-compose.yml может публиковать порт 5432 наружу

### DEF-015: Priorities UNIQUE constraint conflict
```sql
name VARCHAR(100) UNIQUE NOT NULL,  -- глобальный UNIQUE
...
UNIQUE(user_id, name)               -- per-user UNIQUE
```
Оба constraints одновременно — логическая ошибка.

### DEF-016: tasks.datatask_id
- Индекс существует: `idx_tasks_datatask_id ON tasks(datatask_id)`
- Колонка отсутствует в CREATE TABLE

## 10. Зависимости

### Backend dependencies
```
bcrypt, cors, dotenv, express, express-rate-limit
express-validator, helmet, jsonwebtoken, multer, pg
```

### Backend devDependencies
```
@jest/globals, jest, nodemon, supertest
```

### Frontend dependencies
```
axios, react, react-dom, react-router-dom
@headlessui/react, @heroicons/react
lexical, @lexical/*, compromise, marked
date-fns, lucide-react
```

### Frontend devDependencies
```
vite, @vitejs/plugin-react, tailwindcss
vitest, @testing-library/*
oxlint
```

## 11. Текущая архитектура

```
           Client Browser
                 │
                 ↓
            localhost:5173 (Vite dev)
                 │
                 ↓
          hardcoded URLs:
          localhost:5001/api/*
                 │
                 ↓
            Backend :5000
                 │
       ┌─────────┴─────────┐
       │                   │
       ↓                   ↓
   Controllers         PostgreSQL
       │                  :5432
       ↓
   Raw SQL queries
```

**Проблемы:**
- Frontend напрямую обращается к localhost:5001 (несуществующий порт)
- Backend на :5000
- Нет nginx reverse proxy в dev режиме
- Нет service/repository layer
- Controllers содержат SQL
- Нет единого API client
- PostgreSQL может быть открыт наружу

## 12. Тестовое покрытие

**Backend:**
- Jest настроен
- Файлы тестов: неизвестно
- Coverage: неизвестен

**Frontend:**
- Vitest настроен
- Testing Library настроен
- Файлы тестов: неизвестно
- Coverage: неизвестен

**Integration/E2E:**
- Отсутствуют

## 13. CI/CD

- GitHub Actions: неизвестно
- Другие CI: неизвестно
- Deployment pipeline: ручной Docker Compose

## 14. Security

**Текущие меры:**
- helmet middleware
- express-rate-limit
- CORS
- JWT authentication
- bcrypt для паролей

**Проблемы:**
- JWT в localStorage (XSS risk)
- Отсутствие authorization checks
- Возможные hardcoded secrets
- PostgreSQL exposed
- Отсутствие CSP
- Отсутствие input sanitization

## 15. Документация

**Существующие документы:**
- README.md
- START_HERE.md
- DOCKER_READY.md
- DOCKER_DEPLOY.md
- MIGRATION_SUMMARY.md
- CODE_REVIEW.md
- различные test guides

**Отсутствующие:**
- OpenAPI/Swagger спецификация
- Architecture документация
- Database схема документация
- API contract документация
- Deployment guide (полный)

## 16. Критические блокеры для production

1. ❌ Единая система миграций
2. ❌ Воспроизводимая сборка из чистого checkout
3. ❌ Исправление hardcoded localhost URLs
4. ❌ Authorization/tenant isolation
5. ❌ Secrets management
6. ❌ PostgreSQL security
7. ❌ Persistent uploads storage
8. ❌ DB schema consistency
9. ❌ API contract definition
10. ❌ Integration tests

---

**Статус**: Приложение находится в состоянии MVP с критическими архитектурными долгами. Не готово для production без рефакторинга P0 задач.

**Следующий шаг**: Выполнение плана рефакторинга начиная с Этапа 1 — единая система миграций.
