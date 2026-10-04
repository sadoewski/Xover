# Xover — план рефакторинга и стабилизации

## 0. Цель проекта

Цель рефакторинга — привести приложение к состоянию, в котором:

1. проект воспроизводимо собирается из чистого checkout;
2. новая PostgreSQL БД полностью поднимается только штатной системой миграций;
3. схема БД, backend и frontend используют один согласованный контракт;
4. frontend не содержит environment-specific URL и не обходит API layer;
5. каждый ресурс защищён не только authentication, но и authorization;
6. бизнес-инварианты защищены на уровне backend и, где возможно, PostgreSQL;
7. основные пользовательские сценарии покрыты integration/E2E тестами;
8. CI способен обнаружить breaking change в API, БД или production build;
9. Docker Compose поднимает полностью работоспособный стек с нуля;
10. приложение можно безопасно обновлять без ручного редактирования production БД.

---

# 1. Правила выполнения рефакторинга

## 1.1. Порядок работ

Не выполнять крупный рефакторинг UI или внутреннюю перестройку controllers до исправления инфраструктурных и контрактных проблем.

Рекомендуемый порядок:

1. зафиксировать текущее состояние;
2. привести migration system к единому виду;
3. привести Docker/build к воспроизводимому состоянию;
4. зафиксировать API contract;
5. унифицировать frontend API layer;
6. исправить authorization/data isolation;
7. исправить DB constraints;
8. разделить backend/frontend ответственность;
9. добавить integration/contract/E2E tests;
10. hardening production;
11. обновить документацию;
12. выполнить полный clean-room acceptance test.

---

# 2. Этап 0 — baseline и контрольная точка

## Задачи

Перед изменениями зафиксировать:

- текущие версии Node.js;
- npm;
- PostgreSQL;
- Docker/Docker Compose;
- команды запуска;
- команды тестов;
- список API routes;
- список таблиц БД;
- список миграций;
- переменные окружения;
- текущую структуру frontend services;
- текущие production Dockerfiles.

Создать документ:

```text
docs/architecture-baseline.md
```

Зафиксировать известные дефекты:

- отсутствующие lock-файлы;
- несколько источников схемы БД;
- runtime DDL в `datatasksController`;
- отсутствующие миграции в `migrate.js`;
- hardcoded `localhost:5001`;
- `/api/api/sites`;
- `q` vs `query`;
- несовпадающие DataTask routes;
- отсутствующий `file_size` в RWPrint;
- несогласованный `event_year_notes`;
- отсутствие tenant checks;
- production upload issues;
- hardcoded secrets;
- PostgreSQL exposed наружу.

## Критерии приёмки

- baseline-документ создан;
- перечислены все backend routes;
- перечислены все DB tables/columns;
- перечислены все миграции;
- зафиксированы команды build/test;
- создан список известных дефектов с ID;
- после baseline дальнейшие изменения можно сравнивать с исходным состоянием.

---

# 3. Этап 1 — единая система миграций PostgreSQL

## Проблема

Сейчас схема разделена между:

```text
backend/src/db/schema.sql
backend/src/migrations/*.sql
backend/migrations/*.sql
```

и частью создаётся динамически из application runtime.

Это необходимо полностью устранить.

## Задачи

Создать единую директорию:

```text
backend/migrations/
```

Ввести версионирование:

```text
001_initial.sql
002_auth.sql
003_tasks.sql
004_events.sql
005_datatasks.sql
006_rwprint.sql
007_sites.sql
008_indexes.sql
...
```

Создать таблицу:

```sql
schema_migrations
```

с информацией о применённых миграциях.

Migration runner должен:

1. подключаться к PostgreSQL;
2. создавать `schema_migrations`, если её нет;
3. находить неприменённые миграции;
4. выполнять их в порядке;
5. выполнять каждую миграцию транзакционно, где PostgreSQL это позволяет;
6. фиксировать успешную миграцию;
7. завершаться с ошибкой при failure;
8. не выполнять уже применённые миграции повторно.

Удалить runtime schema mutation:

```text
datatasksController.initTables()
```

и любые аналогичные механизмы.

`schema.sql` либо удалить, либо оставить только как исторический reference, но он не должен использоваться как второй источник истины.

## Критерии приёмки

### Clean database

Следующая последовательность должна полностью создать рабочую БД:

```bash
docker compose down -v
docker compose up -d db
npm run db:migrate
```

После миграций присутствуют все таблицы:

```text
users
groups
priorities
tasks
task_logs
task_relations
events
event_year_notes
datatasks
datatask_dates
rwprint_environments
rwprint_folders
rwprint_documents
rwprint_tags
rwprint_document_tags
rwprint_document_metadata
sites
site_items
...
```

### Повторный запуск

```bash
npm run db:migrate
npm run db:migrate
```

второй запуск не меняет БД и не создаёт дубликатов.

### Failure handling

Если миграция падает:

- migration не помечается как применённая;
- ошибка видна в stdout/stderr;
- приложение не делает вид, что БД успешно подготовлена.

### Runtime

После запуска backend не выполняет DDL (`CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`) в рамках обычного API request.

---

# 4. Этап 2 — исправление схемы БД и DB contract

## Задачи

Провести сверку:

```text
DB schema
↔
repositories/services
↔
controllers
```

Исправить все несовпадения.

Минимальный обязательный список:

### DataTasks

Убедиться, что:

```text
tasks.datatask_id
datatasks
datatask_dates
```

создаются миграциями.

### Events

Добавить/зафиксировать поля, которые реально использует backend:

```text
event_year_notes.user_id
event_year_notes.updated_at
```

если они действительно являются частью модели.

### RWPrint

Привести schema и controller к единой модели.

В частности проверить `file_size`:

- либо добавить колонку;
- либо изменить controller на реальное поле схемы.

### Sites

`sites` и `site_items` должны создаваться штатными миграциями.

## Критерии приёмки

Создать автоматическую DB schema test:

```text
empty database
→ migrations
→ schema assertions
```

Тест должен проверять:

- наличие каждой таблицы;
- наличие обязательных колонок;
- типы колонок;
- PK;
- FK;
- UNIQUE constraints;
- CHECK constraints;
- индексы.

Ни один backend SQL query не должен обращаться к несуществующей колонке.

---

# 5. Этап 3 — package-lock и воспроизводимый dependency build

## Задачи

Для каждого npm package boundary создать lock-файл.

Проверить:

```text
package.json
package-lock.json
```

Убрать `package-lock.json` из `.gitignore`.

Dockerfile должен использовать:

```bash
npm ci
```

а не `npm install`.

Зафиксировать Node.js version через:

```text
.nvmrc
```

или `engines` + Docker base image.

Проверить зависимости на:

- duplicate packages;
- unused packages;
- deprecated packages;
- known vulnerabilities.

## Критерии приёмки

В чистом checkout:

```bash
npm ci
```

проходит без изменения lock-файла.

Docker:

```bash
docker compose build --no-cache
```

проходит с нуля.

Повторная сборка использует те же dependency versions.

---

# 6. Этап 4 — production Docker и deployment pipeline

## Задачи

Привести Docker Compose к архитектуре:

```text
Internet
   ↓
nginx
   ├── /       → frontend
   └── /api    → backend:5000
                    ↓
                 postgres
```

PostgreSQL не должен быть опубликован наружу в production.

Убрать:

```yaml
ports:
  - "5432:5432"
```

если внешний доступ не нужен.

Добавить backend healthcheck:

```text
GET /health
```

и использовать его в `depends_on`.

Разделить:

```text
development compose
production compose
```

если это необходимо.

## Secrets

Убрать из репозитория:

```text
POSTGRES_PASSWORD
JWT_SECRET
```

и прочие реальные secrets.

Использовать environment variables/secrets.

## Uploads

Определить production storage strategy:

- persistent Docker volume;
- отдельный storage;
- S3-compatible storage.

Не полагаться на ephemeral container filesystem.

## Критерии приёмки

Полностью чистый запуск:

```bash
docker compose down -v
docker compose up --build
```

поднимает:

- nginx;
- frontend;
- backend;
- PostgreSQL.

Healthchecks проходят.

Приложение доступно через один публичный origin.

В production frontend не делает запросов к:

```text
localhost:5000
localhost:5001
```

PostgreSQL недоступен снаружи Docker network.

После перезапуска backend uploads не исчезают.

---

# 7. Этап 5 — единый API contract

## Задачи

Создать OpenAPI specification:

```text
docs/openapi.yaml
```

Описать:

- authentication;
- users;
- groups;
- priorities;
- tasks;
- events;
- datatasks;
- RWPrint;
- sites;
- morphology.

Для каждого endpoint определить:

- HTTP method;
- path;
- query params;
- path params;
- request body;
- response;
- error format;
- authorization requirements.

## Нормализовать API naming

Например:

```text
GET    /api/sites
GET    /api/sites/:id
POST   /api/sites
PATCH  /api/sites/:id
DELETE /api/sites/:id
```

и аналогично для остальных ресурсов.

Не должно существовать двух разных способов сделать одну операцию без необходимости.

## Критерии приёмки

- OpenAPI соответствует фактическим routes.
- Каждый public API endpoint описан.
- Для каждого endpoint есть минимум success + validation + authorization response.
- Изменение API, несовместимое с OpenAPI, обнаруживается в CI.
- `q`/`query` и аналогичные naming mismatches устранены.

---

# 8. Этап 6 — единый frontend API layer

## Задачи

Все HTTP-запросы frontend должны идти через:

```text
frontend/src/services/
```

или единый typed API client.

Запретить:

```js
axios.get('http://localhost:5001/...')
```

в React components/pages.

Ввести единый base URL:

```text
VITE_API_URL=/api
```

Services должны использовать относительные paths:

```js
api.get('/sites')
```

а не:

```js
api.get('/api/sites')
```

## DataTask

Утвердить один contract для date endpoint.

Например:

```text
DELETE /datatasks/:id/dates/:date
```

и привести:

- service;
- controller;
- routes;
- pages;
- tests

к этому варианту.

## Критерии приёмки

Поиск:

```bash
grep -R "localhost:5000" frontend/src
grep -R "localhost:5001" frontend/src
```

не возвращает production API calls.

Поиск прямых `axios`/`fetch` в components/pages не возвращает HTTP business requests.

`sitesService` не генерирует `/api/api/...`.

Все API services используют единый base URL.

---

# 9. Этап 7 — authentication и authorization

## Задачи

Разделить понятия:

```text
Authentication:
кто пользователь?

Authorization:
может ли этот пользователь работать с ресурсом?
```

Создать единый authorization layer.

Для каждой сущности определить ownership model.

Пример:

```text
User
 ├── Group
 ├── Priority
 ├── Task
 ├── Event
 ├── DataTask
 ├── Environment
 │    ├── Folder
 │    ├── Document
 │    └── Tag
 └── Site
      └── SiteItem
```

Каждый endpoint должен проверять ownership через `req.userId`.

## Особенно проверить

RWPrint:

- environment;
- folder;
- document;
- tag;
- metadata.

Tasks:

- group;
- priority;
- task;
- task relation.

Sites:

- site;
- site item.

DataTasks:

- DataTask;
- связанные tasks.

## Критерии приёмки

Создать минимум двух пользователей:

```text
User A
User B
```

User A создаёт каждый тип ресурса.

User B пытается:

- GET resource A;
- PATCH resource A;
- DELETE resource A;
- attach resource A;
- modify metadata resource A;
- использовать resource A как parent;
- использовать чужой ID в create request.

Все такие действия должны получать:

```text
403
```

или безопасный `404`, в зависимости от выбранной модели.

Ни один IDOR сценарий не должен быть успешным.

---

# 10. Этап 8 — database-level integrity

## Задачи

Где бизнес-инвариант можно выразить в PostgreSQL — выразить его там.

Проверить:

```text
UNIQUE
CHECK
NOT NULL
FK
ON DELETE
```

Исправить проблему `priorities`:

если уникальность должна быть per-user:

```sql
UNIQUE(user_id, name)
```

не должно одновременно существовать глобального:

```sql
UNIQUE(name)
```

если он не нужен.

Проверить cascade semantics для всех связанных ресурсов.

## Критерии приёмки

БД сама отклоняет:

- duplicate values там, где они запрещены;
- invalid status;
- invalid FK;
- orphan records;
- недопустимые NULL.

Для каждой критичной бизнес-таблицы есть список инвариантов.

---

# 11. Этап 9 — backend architecture refactor

## Задачи

Перейти от:

```text
route
 ↓
controller
 ↓
SQL
```

к:

```text
route
 ↓
controller
 ↓
service
 ↓
repository
 ↓
PostgreSQL
```

### Controller

Только:

- HTTP input;
- validation result;
- вызов service;
- HTTP response.

### Service

Содержит:

- business rules;
- authorization orchestration;
- transactions;
- domain logic.

### Repository

Содержит:

- SQL;
- DB-specific details.

## Разделить крупные controllers

Особенно:

```text
rwprintController
tasksController
datatasksController
```

на отдельные resource modules.

## Критерии приёмки

Controller не содержит сложных SQL queries.

Repository не знает о:

```text
req
res
JWT
HTTP status
```

Service не знает о:

```text
Express response object
```

Каждый основной domain module имеет отдельные:

```text
controller
service
repository
validation
tests
```

---

# 12. Этап 10 — frontend component refactor

## Задачи

Разделить огромные components.

Особое внимание:

```text
RWPrintContent.jsx
CalendarPage.jsx
EventsPage.jsx
TaskDetailPage.jsx
DocumentEditor.jsx
```

Например RWPrint:

```text
RWPrintPage
 ├── EnvironmentSidebar
 ├── FolderTree
 ├── DocumentList
 ├── DocumentEditor
 ├── TagPanel
 ├── MetadataPanel
 └── StorageStats
```

Вынести:

- data fetching;
- state management;
- UI;
- mutations

в разные hooks/services/components.

## Критерии приёмки

Новый разработчик может изменить один элемент RWPrint без изменения монолитного компонента.

Компоненты не содержат прямых HTTP requests.

Компоненты не содержат SQL/API URL.

Критические business operations тестируются независимо от UI.

---

# 13. Этап 11 — validation и error contract

## Задачи

Ввести единый формат API errors.

Например:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

Определить:

```text
400 validation
401 authentication
403 authorization
404 resource
409 conflict
422 domain validation
429 rate limit
500 internal error
```

Все endpoints должны придерживаться этого формата.

## Критерии приёмки

Frontend не разбирает десятки разных форматов ошибок.

Для каждого основного endpoint есть tests на:

- valid request;
- invalid body;
- missing auth;
- insufficient permissions;
- nonexistent resource;
- conflict.

---

# 14. Этап 12 — morphology hardening

## Задачи

Для:

```text
/api/morphology/analyze
```

добавить:

- максимальный размер текста;
- rate limit;
- concurrency limit;
- timeout;
- контроль Python process;
- нормальную обработку subprocess failure.

Не запускать бесконтрольное количество Python processes.

По возможности использовать persistent worker.

## Критерии приёмки

Запрос с текстом выше установленного лимита получает `413` или `400`.

Burst из большого количества запросов не создаёт неограниченное количество Python processes.

Python process timeout корректно возвращает controlled error.

Backend продолжает отвечать после падения одного morphology worker.

---

# 15. Этап 13 — uploads и static files

## Задачи

Определить:

```text
avatar storage
document storage
generated files
```

как отдельные storage domains.

Не хранить критичные пользовательские файлы только внутри container filesystem.

Проверить:

- directory creation;
- permissions;
- file size limits;
- MIME validation;
- extension validation;
- filename sanitization;
- path traversal;
- static URL generation.

## Критерии приёмки

Upload работает:

1. на чистом запуске;
2. после restart контейнера;
3. после deploy;
4. при параллельных uploads.

Невалидный файл не сохраняется.

Нельзя записать файл вне разрешённого storage path.

---

# 16. Этап 14 — security hardening

## Обязательно

### Secrets

Никаких production secrets в git.

### JWT

Рассмотреть переход с `localStorage` на:

```text
HttpOnly
Secure
SameSite
```

cookies.

Если localStorage сохраняется — добавить сильную CSP и документировать риск.

### CORS

Разрешать только реальные origins.

### Rate limiting

Расширить за пределы `/auth`.

Особенно:

```text
morphology
uploads
expensive queries
```

### Helmet

Оставить и проверить настройки.

### CSP

Добавить Content Security Policy после проверки editor functionality.

## Критерии приёмки

Автоматизированный security scan не находит:

- committed secrets;
- obvious IDOR;
- unrestricted CORS;
- missing basic security headers;
- unlimited expensive endpoints.

---

# 17. Этап 15 — тестовая стратегия

Создать четыре уровня.

## Unit tests

Для:

- services;
- validators;
- domain logic;
- utility functions.

## Integration tests

Backend + real PostgreSQL.

Тестировать:

```text
route
→ controller
→ service
→ repository
→ DB
```

## Contract tests

Проверять соответствие:

```text
OpenAPI
↔ backend
```

и, где возможно:

```text
OpenAPI
↔ frontend client
```

## E2E tests

Минимальные critical paths:

### Authentication

```text
register
login
logout/session expiration
```

### Tasks

```text
create
read
update
delete
relations
```

### Events

```text
create
edit
delete
year notes
```

### DataTasks

```text
create
dates
linked tasks
```

### RWPrint

```text
environment
folder
document
tag
metadata
```

### Sites

```text
site
items
search
```

## Критерии приёмки

CI выполняет:

```bash
npm test
npm run test:integration
npm run test:e2e
```

на чистой test DB.

Все critical paths проходят.

---

# 18. Этап 16 — regression tests для найденных дефектов

Каждый дефект из discovery должен получить regression test.

Минимальный список:

```text
REG-001 clean DB creates DataTask schema
REG-002 clean DB creates RWPrint schema
REG-003 clean DB creates Sites schema
REG-004 event_year_notes schema matches controller
REG-005 RWPrint storage stats uses real column
REG-006 frontend does not call localhost
REG-007 sites URL is /api/sites exactly once
REG-008 sites search uses agreed parameter
REG-009 DataTask date DELETE contract is consistent
REG-010 User B cannot access User A task
REG-011 User B cannot access User A RWPrint document
REG-012 User B cannot access User A tag
REG-013 User B cannot use User A environment
REG-014 avatar upload works after clean start
REG-015 uploads survive container restart
REG-016 morphology is rate limited
REG-017 production Docker build succeeds from clean checkout
REG-018 migrations are idempotent
REG-019 no committed secrets
REG-020 PostgreSQL is not externally exposed in production
```

## Критерии приёмки

Все REG tests проходят.

Любое возвращение старого дефекта ломает CI.

---

# 19. Этап 17 — CI/CD

## Pipeline

Рекомендуемый pipeline:

```text
checkout
   ↓
npm ci
   ↓
lint
   ↓
unit tests
   ↓
build frontend
   ↓
build backend
   ↓
start PostgreSQL
   ↓
run migrations
   ↓
integration tests
   ↓
API contract tests
   ↓
Docker build
   ↓
E2E
   ↓
security checks
```

## Отдельная проверка migrations

CI должен запускать:

```text
empty DB
→ all migrations
→ backend startup
→ integration tests
```

## Критерии приёмки

Pull Request не может быть merged, если:

- build failed;
- tests failed;
- migrations failed;
- OpenAPI contract failed;
- security check failed;
- Docker image failed to build.

---

# 20. Этап 18 — logging и observability

## Задачи

Ввести structured logging.

Каждый request должен иметь:

```text
requestId
timestamp
method
path
status
duration
userId (если есть)
```

Не логировать:

- password;
- JWT;
- secrets;
- sensitive payloads.

Добавить:

```text
GET /health
GET /ready
```

Разделить:

```text
liveness
readiness
```

## Критерии приёмки

По одному request ID можно найти весь request flow в backend logs.

Ошибки DB/API имеют понятный context.

Secrets отсутствуют в логах.

---

# 21. Этап 19 — документация

Обновить:

```text
README.md
docs/architecture.md
docs/openapi.yaml
docs/deployment.md
docs/database.md
docs/testing.md
```

README должен содержать только актуальные команды.

Минимально:

```bash
npm ci
npm run dev
npm test
npm run db:migrate
docker compose up --build
```

## Критерии приёмки

Новый разработчик с чистой машиной может:

1. клонировать repository;
2. установить зависимости;
3. поднять БД;
4. применить миграции;
5. запустить backend;
6. запустить frontend;
7. выполнить tests;

не читая старые сообщения/issue и не выполняя ручные SQL fixes.

---

# 22. Этап 20 — code quality gates

Добавить:

- ESLint;
- Prettier;
- проверку unused imports;
- проверку циклических dependencies;
- проверку duplicate code;
- dependency audit.

Для backend запретить:

- SQL string interpolation для пользовательских значений;
- runtime DDL;
- `console.log` вместо logger.

Для frontend запретить:

- hardcoded API URLs;
- прямые HTTP calls из UI components.

## Критерии приёмки

CI fail при появлении запрещённых patterns.

Lint проходит без warnings, либо warnings имеют явно согласованный список исключений.

---

# 23. Этап 21 — финальный clean-room test

После завершения рефакторинга необходимо проверить приложение не в текущем developer environment, а с нуля.

## Procedure

Удалить:

```text
node_modules
build artifacts
Docker volumes
Docker images проекта
```

Клонировать repository заново.

Затем:

```bash
npm ci
docker compose build --no-cache
docker compose up -d
npm run db:migrate
npm test
npm run test:integration
npm run test:e2e
```

После этого вручную проверить:

```text
login
groups
priorities
tasks
events
datatasks
RWPrint
sites
uploads
morphology
```

## Критерии приёмки

Нет ручных SQL commands.

Нет ручного создания директорий.

Нет ручного изменения `.env` внутри контейнера.

Нет обращения к localhost из browser runtime.

Нет failed migrations.

Нет failed tests.

Нет ошибок `relation does not exist`.

Нет ошибок `column does not exist`.

Нет 404/500 на штатных пользовательских сценариях.

---

# 24. Definition of Done

Рефакторинг считается завершённым только если выполнены ВСЕ пункты.

## Build

- [ ] `npm ci` проходит из чистого checkout.
- [ ] frontend build проходит.
- [ ] backend build/start проходит.
- [ ] Docker build проходит без cache.
- [ ] dependency versions воспроизводимы.

## Database

- [ ] существует одна система migrations.
- [ ] `schema.sql` больше не является вторым источником истины.
- [ ] все tables создаются миграциями.
- [ ] все columns соответствуют backend.
- [ ] все FK/UNIQUE/CHECK constraints актуальны.
- [ ] migrations idempotent.
- [ ] migrations не выполняются из API requests.

## API

- [ ] OpenAPI создан.
- [ ] frontend/backend используют одинаковые paths.
- [ ] query/path/body parameters согласованы.
- [ ] единый error contract.
- [ ] нет hardcoded localhost URLs.
- [ ] нет `/api/api/...`.
- [ ] нет расхождений DataTask routes.

## Authorization

- [ ] каждый ресурс имеет определённую ownership model.
- [ ] IDOR tests проходят.
- [ ] User A не может читать/изменять User B resources.
- [ ] parent resources проверяются.
- [ ] RWPrint полностью tenant-isolated.

## Frontend

- [ ] все HTTP requests идут через API layer.
- [ ] pages/components не знают deployment URL.
- [ ] крупные компоненты разделены.
- [ ] API responses типизированы или имеют единый schema contract.

## Backend

- [ ] controllers не содержат сложный SQL.
- [ ] business logic вынесена в services.
- [ ] SQL вынесен в repositories.
- [ ] validation централизована.
- [ ] error handling унифицирован.

## Security

- [ ] secrets отсутствуют в repository.
- [ ] PostgreSQL не опубликован наружу.
- [ ] CORS ограничен.
- [ ] rate limiting включён для expensive endpoints.
- [ ] uploads защищены.
- [ ] JWT storage strategy документирована.
- [ ] security headers настроены.

## Testing

- [ ] unit tests проходят.
- [ ] integration tests проходят на чистой PostgreSQL.
- [ ] API contract tests проходят.
- [ ] E2E critical paths проходят.
- [ ] все discovery defects имеют regression tests.

## Deployment

- [ ] `docker compose up --build` работает с нуля.
- [ ] healthchecks работают.
- [ ] uploads persistent.
- [ ] migrations запускаются автоматически/штатно в deployment pipeline.
- [ ] restart не ломает приложение.
- [ ] application доступен через один public origin.

## Documentation

- [ ] README актуален.
- [ ] deployment documentation актуальна.
- [ ] database documentation актуальна.
- [ ] OpenAPI актуален.
- [ ] architecture documentation актуальна.

---

# 25. Приоритеты выполнения

## P0 — блокеры

Выполнить первыми:

1. единая migration system;
2. clean DB bootstrap;
3. исправление DB/schema mismatches;
4. package-lock;
5. reproducible Docker build;
6. удаление hardcoded localhost;
7. исправление `/api/api/sites`;
8. исправление DataTask API contract;
9. authorization/IDOR;
10. production secrets;
11. uploads;
12. PostgreSQL network exposure.

**До выполнения P0 не считать приложение production-ready.**

## P1 — стабильность

1. OpenAPI;
2. frontend API layer;
3. DB constraints;
4. unified errors;
5. integration tests;
6. contract tests;
7. critical E2E;
8. morphology hardening;
9. health/readiness;
10. CI pipeline.

## P2 — maintainability

1. controller/service/repository split;
2. frontend component decomposition;
3. TypeScript для новых/критичных API;
4. logging;
5. lint/format/code quality gates;
6. documentation.

## P3 — улучшения

1. JWT → HttpOnly cookies;
2. persistent worker для morphology;
3. storage abstraction;
4. performance profiling;
5. query optimization;
6. caching;
7. observability/metrics.

---

# 26. Финальный технический результат

После выполнения плана архитектура должна выглядеть примерно так:

```text
                         INTERNET
                            │
                            ▼
                         NGINX
                       /        \
                      /          \
                     ▼            ▼
                FRONTEND        /api
                                  │
                                  ▼
                              BACKEND
                                  │
                  ┌───────────────┼────────────────┐
                  │               │                │
                  ▼               ▼                ▼
             Controllers      Services        Validators
                                  │
                                  ▼
                             Repositories
                                  │
                                  ▼
                             PostgreSQL
                                  ▲
                                  │
                            Migrations
```

Frontend:

```text
React
  ↓
Typed API client
  ↓
OpenAPI contract
  ↓
/api
```

Database:

```text
Migration 001
Migration 002
Migration 003
...
       ↓
schema_migrations
       ↓
PostgreSQL
```

Security:

```text
JWT/session
    ↓
Authentication
    ↓
Authorization
    ↓
Ownership check
    ↓
Service
    ↓
Repository
    ↓
DB
```

Главный критерий готовности — не отсутствие lint errors и не красивый Dockerfile. Приложение должно быть **воспроизводимым**: любой разработчик или CI runner должен получить одинаковую рабочую систему из чистого repository без ручных SQL fixes, ручного создания директорий и изменения URL внутри исходников.

