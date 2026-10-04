# CI/CD Documentation

## Обзор

Проект использует GitHub Actions для автоматизации:
- ✅ Тестирования (unit + integration)
- ✅ Сборки (build verification)
- ✅ Security scanning
- ✅ Деплоя документации

## Архитектура

```
┌─────────────────────────────────────────────┐
│           Git Push / Pull Request           │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────▼────────────┐
      │  Detect Changes (ci.yml)│
      │  - backend/**           │
      │  - frontend/**          │
      └───────────┬────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼─────┐      ┌─────▼────┐
   │ Backend  │      │ Frontend │
   │ CI       │      │ CI       │
   └────┬─────┘      └─────┬────┘
        │                   │
        │  ┌────────────┐   │
        └──►  Summary   ◄───┘
           │   Report   │
           └────────────┘
```

## Workflows

### 1. Main CI (ci.yml)

**Триггеры:**
- Push на `main`, `develop`
- Pull Request на `main`, `develop`

**Шаги:**
1. Определить измененные части (backend/frontend)
2. Запустить соответствующие sub-workflows
3. Собрать summary report

**Оптимизация:**
- Запускает только нужные проверки
- Использует `dorny/paths-filter` для определения изменений

### 2. Backend CI (backend-ci.yml)

**Триггер:** Изменения в `backend/**`

**Jobs:**

#### lint-and-test
1. Setup PostgreSQL 15 (service container)
2. Install Node.js 20 + dependencies
3. Run linter (если настроен)
4. Apply database migrations
5. Run integration tests
6. Generate coverage report
7. Upload to Codecov

**Среда:**
```yaml
PostgreSQL 15-alpine
Node.js 20
npm ci (clean install)
```

**Переменные:**
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostprint_test
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=test-jwt-secret
```

#### security-scan
1. npm audit (production deps)
2. npm audit (all deps, moderate level)

#### build
1. Install dependencies
2. Syntax check (`node -c`)

**Длительность:** ~2-3 минуты

### 3. Frontend CI (frontend-ci.yml)

**Триггер:** Изменения в `frontend/**`

**Jobs:**

#### lint-and-test
1. Install Node.js 20 + dependencies
2. Run linter (если настроен)
3. Run tests (если настроены)

#### build
1. Production build (`npm run build`)
2. Check build size
3. Upload artifacts (retention: 7 дней)

**Артефакты:**
- `frontend-build` — готовая сборка в `dist/`

**Длительность:** ~1-2 минуты

### 4. Security Scan (security.yml)

**Триггеры:**
- Schedule: каждый понедельник 9:00 UTC
- Push на `main`
- Manual dispatch

**Jobs:**

#### dependency-review
- Проверка новых уязвимостей в зависимостях (только на PR)

#### security-scan
1. Trivy vulnerability scanner
2. Upload SARIF to GitHub Security
3. npm audit (backend + frontend)
4. Upload audit reports (artifacts)

#### codeql-analysis
1. Initialize CodeQL
2. Analyze JavaScript code
3. Report security issues

**Артефакты:**
- `security-audit-reports` (retention: 30 дней)

**Длительность:** ~3-5 минут

### 5. Documentation (docs.yml)

**Триггер:** Изменения в `docs/**` на `main`

**Шаги:**
1. Validate OpenAPI spec
2. Generate Swagger UI
3. Deploy to GitHub Pages

**URL:** `https://sadoewski.github.io/hostprint/`

## Кеширование

Workflows используют кеш для ускорения:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json
```

**Преимущества:**
- Быстрее на 30-50%
- Меньше нагрузка на npm registry
- Предсказуемость сборок

## Мониторинг

### GitHub Actions Tab
- Все запуски workflows
- История успехов/неудач
- Логи каждого шага
- Время выполнения

### Security Tab
- CodeQL alerts
- Dependabot alerts
- Secret scanning

### Insights
- Dependency graph
- Network activity
- Contributors

## Локальная проверка

Перед push:

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend build
cd frontend
npm run build

# Security audit
npm audit
```

## Оптимизация времени

### Текущее время выполнения
- Backend CI: ~2-3 мин
- Frontend CI: ~1-2 мин
- Security Scan: ~3-5 мин

### Возможные улучшения

1. **Parallel matrix builds** (будущее)
```yaml
strategy:
  matrix:
    node-version: [18, 20]
```

2. **Кеш node_modules** (уже реализовано)
```yaml
cache: 'npm'
```

3. **Условный запуск** (уже реализовано)
```yaml
if: needs.changes.outputs.backend == 'true'
```

## Troubleshooting

### Tests fail in CI but pass locally

**Причины:**
- Разные версии Node.js
- Отсутствие переменных окружения
- PostgreSQL не готов

**Решение:**
```yaml
# Добавить health checks для PostgreSQL
options: >-
  --health-cmd pg_isready
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
```

### Build artifacts not uploaded

**Причины:**
- Неправильный путь
- Build не создал директорию

**Решение:**
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: frontend-build
    path: frontend/dist/  # Проверить путь!
    if-no-files-found: error
```

### Coverage не отправляется в Codecov

**Решение:**
1. Добавить `CODECOV_TOKEN` в Secrets
2. Или использовать public repo (токен не нужен)

### Security scan ложные срабатывания

**Решение:**
1. Проверить уязвимость
2. Обновить зависимости: `npm update`
3. Добавить в `.trivyignore` если false positive

## Secrets Management

### Необходимые secrets

1. **CODECOV_TOKEN** (опционально)
   - Для отправки coverage в Codecov
   - Получить: https://codecov.io

2. **GITHUB_TOKEN** (автоматически)
   - Предоставляется GitHub Actions
   - Нет необходимости добавлять

### Добавление secrets

```
Settings → Secrets and variables → Actions → New repository secret
```

## Dependabot

Автоматические обновления зависимостей:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
```

**Поведение:**
- Создает PR каждую неделю (понедельник 9:00)
- Проверяет backend, frontend, GitHub Actions
- Игнорирует major updates (можно настроить)

## Best Practices

### 1. Быстрый feedback
- ❌ Не запускать все тесты на каждое изменение
- ✅ Запускать только affected tests

### 2. Fail fast
- ❌ Не ждать конца всех jobs при ошибке
- ✅ Использовать `fail-fast: true` в matrix

### 3. Кеширование
- ❌ Не скачивать зависимости каждый раз
- ✅ Использовать `cache: 'npm'`

### 4. Параллелизм
- ❌ Не запускать jobs последовательно
- ✅ Использовать `needs:` только где необходимо

### 5. Мониторинг
- ❌ Не игнорировать failed builds
- ✅ Настроить notifications

## Метрики

### Целевые показатели
- ⏱️ Backend CI: < 3 мин
- ⏱️ Frontend CI: < 2 мин
- ✅ Success rate: > 95%
- 🔒 Security issues: 0 critical

### Отслеживание
```bash
# Время выполнения
gh run list --workflow=backend-ci.yml --limit 10

# Success rate
gh run list --workflow=backend-ci.yml --status completed --limit 100
```

## Roadmap

### Планируется
- [ ] E2E tests в CI
- [ ] Contract tests validation
- [ ] Lighthouse CI (performance)
- [ ] Visual regression tests
- [ ] Auto-deploy to staging
- [ ] Canary deployments
- [ ] Performance budgets

### В исследовании
- [ ] GitLab CI (альтернатива)
- [ ] CircleCI (альтернатива)
- [ ] Jenkins (self-hosted)
