# Hostprint API Documentation

## OpenAPI спецификация создана! 🎉

Полная OpenAPI 3.0.3 спецификация для всех API endpoints приложения Hostprint.

---

## 📊 Статистика

- **Endpoints:** 79 (все из backend/src/routes/)
- **Tags (модулей):** 10
- **Schemas:** 20+
- **Security:** JWT Bearer authentication

---

## 📚 Endpoints по модулям

### Authentication (7 endpoints)
- POST `/api/auth/register` — Регистрация
- POST `/api/auth/login` — Вход
- GET `/api/auth/me` — Текущий пользователь
- PUT `/api/auth/profile` — Обновить профиль
- POST `/api/auth/upload-avatar` — Загрузить аватар
- POST `/api/auth/change-password` — Изменить пароль
- **Rate limit:** 5 запросов / 15 минут (login, register)

### Priorities (5 endpoints)
- GET `/api/priorities` — Список приоритетов
- POST `/api/priorities` — Создать
- GET `/api/priorities/{id}` — По ID
- PUT `/api/priorities/{id}` — Обновить
- DELETE `/api/priorities/{id}` — Удалить

### Groups (7 endpoints)
- GET `/api/groups` — Список групп
- POST `/api/groups` — Создать группу
- GET `/api/groups/{id}` — По ID
- PUT `/api/groups/{id}` — Обновить
- DELETE `/api/groups/{id}` — Удалить
- POST `/api/groups/{groupId}/types` — Создать тип
- DELETE `/api/groups/types/{id}` — Удалить тип

### Tasks (10 endpoints)
- GET `/api/tasks/date/{date}` — Задачи по дате
- GET `/api/tasks/{id}` — По ID
- POST `/api/tasks` — Создать
- PUT `/api/tasks/{id}` — Обновить
- DELETE `/api/tasks/{id}` — Удалить
- GET `/api/tasks/{id}/logs` — История изменений
- POST `/api/tasks/by-ids` — По списку ID
- POST `/api/tasks/link` — Связать задачи
- POST `/api/tasks/unlink` — Отвязать задачи

### Events (10 endpoints)
- GET `/api/events` — Все события
- POST `/api/events` — Создать
- GET `/api/events/month/{month}` — За месяц
- GET `/api/events/date/{month}/{day}` — На дату
- GET `/api/events/{id}` — По ID
- PUT `/api/events/{id}` — Обновить
- DELETE `/api/events/{id}` — Удалить
- GET `/api/events/{eventId}/notes` — Заметки события
- POST `/api/events/{eventId}/notes` — Добавить заметку
- DELETE `/api/events/{eventId}/notes/{noteId}` — Удалить заметку

### DataTasks (8 endpoints)
- GET `/api/datatasks` — Все DataTasks
- POST `/api/datatasks` — Создать
- GET `/api/datatasks/{id}` — По ID
- PUT `/api/datatasks/{id}` — Обновить
- DELETE `/api/datatasks/{id}` — Удалить
- POST `/api/datatasks/{id}/dates` — Добавить дату
- DELETE `/api/datatasks/{id}/dates/{date}` — Удалить дату
- PUT `/api/datatasks/{id}/dates/{date}/status` — Обновить статус

### RWPrint (18 endpoints)
**Environments:**
- GET `/api/rwprint/environments` — Список окружений
- POST `/api/rwprint/environments` — Создать
- PUT `/api/rwprint/environments/{id}` — Обновить
- DELETE `/api/rwprint/environments/{id}` — Удалить

**Folders:**
- GET `/api/rwprint/environments/{environmentId}/folders` — Список папок
- POST `/api/rwprint/environments/{environmentId}/folders` — Создать
- PUT `/api/rwprint/folders/{id}` — Обновить
- DELETE `/api/rwprint/folders/{id}` — Удалить

**Documents:**
- GET `/api/rwprint/environments/{environmentId}/documents` — Список документов
- POST `/api/rwprint/environments/{environmentId}/documents` — Создать
- POST `/api/rwprint/documents/{id}` — Получить (с паролем)
- PUT `/api/rwprint/documents/{id}` — Обновить
- DELETE `/api/rwprint/documents/{id}` — Удалить
- GET `/api/rwprint/documents/{documentId}/metadata` — Метаданные

**Tags:**
- GET `/api/rwprint/environments/{environmentId}/tags` — Список тегов
- POST `/api/rwprint/environments/{environmentId}/tags` — Создать
- DELETE `/api/rwprint/tags/{id}` — Удалить
- POST `/api/rwprint/documents/{documentId}/tags/{tagId}` — Добавить к документу
- DELETE `/api/rwprint/documents/{documentId}/tags/{tagId}` — Удалить из документа
- GET `/api/rwprint/documents/{documentId}/tags` — Теги документа

### Sites (7 endpoints)
- GET `/api/sites` — Все сайты
- POST `/api/sites` — Создать
- GET `/api/sites/{id}` — По ID
- PUT `/api/sites/{id}` — Обновить
- DELETE `/api/sites/{id}` — Удалить
- POST `/api/sites/{id}/items` — Создать элемент
- PUT `/api/sites/{id}/items/{itemId}` — Обновить элемент
- DELETE `/api/sites/{id}/items/{itemId}` — Удалить элемент
- GET `/api/sites/{id}/search` — Поиск по сайту

### Morphology (1 endpoint)
- POST `/api/morphology/analyze` — Морфологический анализ

### Health (1 endpoint)
- GET `/health` — Health check

---

## 🔒 Аутентификация

API использует **JWT Bearer tokens**.

**Получение токена:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Использование токена:**
```bash
curl -X GET http://localhost:5000/api/tasks/date/2026-10-04 \
  -H "Authorization: Bearer <your_token>"
```

---

## 📖 Просмотр документации

### Вариант 1: Swagger UI (локально)

```bash
# Откройте в браузере
open docs/api-docs.html
```

Swagger UI автоматически загрузит `openapi.yaml` и предоставит:
- Интерактивную документацию
- Try it out функционал
- Примеры запросов/ответов
- Схемы данных

### Вариант 2: VS Code расширение

Установите **OpenAPI (Swagger) Editor** и откройте `docs/openapi.yaml`.

### Вариант 3: Online редактор

Загрузите `openapi.yaml` на:
- https://editor.swagger.io/
- https://editor-next.swagger.io/

---

## 🚀 Интеграция в backend

Для автоматической валидации запросов добавьте Swagger middleware:

```bash
cd backend
npm install swagger-ui-express yamljs
```

```javascript
// backend/src/index.js
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(path.join(__dirname, '../../docs/openapi.yaml'));

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

Затем откройте: http://localhost:5000/api-docs

---

## 🔍 Валидация спецификации

Проверить корректность OpenAPI spec:

```bash
# Используя swagger-cli
npm install -g @apidevtools/swagger-cli
swagger-cli validate docs/openapi.yaml

# Или через Docker
docker run --rm -v $(pwd):/workspace openapitools/openapi-generator-cli validate -i /workspace/docs/openapi.yaml
```

---

## 🛠️ Генерация клиентов

Автоматическая генерация SDK для фронтенда:

### TypeScript/JavaScript client

```bash
npx @openapitools/openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g typescript-axios \
  -o frontend/src/api/generated
```

### Python client

```bash
npx @openapitools/openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g python \
  -o clients/python
```

---

## ✅ Следующие шаги

### 1. Интеграция в backend (~10 мин)
- Установить swagger-ui-express
- Добавить `/api-docs` endpoint
- Проверить работу Swagger UI

### 2. Request validation (~30 мин)
- Установить express-openapi-validator
- Автоматическая валидация по схеме
- Тесты валидации

### 3. Response validation (~20 мин)
- Валидация ответов backend
- Тесты coverage

### 4. Generated clients (~30 мин)
- TypeScript SDK для frontend
- Убрать manual axios calls
- Type-safe API calls

---

## 📝 Maintenance

### При добавлении нового endpoint:

1. Добавить в `docs/openapi.yaml`:
   - Path definition
   - Request body schema (если нужен)
   - Response schema
   - Security requirements

2. Обновить документацию:
   - `docs/API_DOCS.md`
   - Примеры использования

3. Проверить валидацию:
   ```bash
   swagger-cli validate docs/openapi.yaml
   ```

---

## 🎯 Критерии приёмки (Этап 5)

- ✅ OpenAPI specification создана
- ✅ Все 79 endpoints задокументированы
- ✅ Schemas для всех entity
- ✅ Authentication описана
- ✅ Rate limiting указан
- ✅ Swagger UI HTML создан
- ⏳ Интеграция в backend (следующий шаг)
- ⏳ Request validation (следующий шаг)

---

**Файлы:**
- `docs/openapi.yaml` — OpenAPI 3.0.3 спецификация
- `docs/api-docs.html` — Swagger UI
- `docs/API_DOCS.md` — Эта документация

**Время выполнения:** ~45 минут
