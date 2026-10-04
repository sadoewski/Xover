# CI/CD Workflows

## Обзор

Проект использует GitHub Actions для автоматизации тестирования, сборки и деплоя.

## Workflows

### 1. CI (ci.yml)
**Триггер**: Push/PR на main, develop

Основной workflow, который:
- Определяет какие части проекта изменились (backend/frontend)
- Запускает соответствующие sub-workflows
- Выводит общий статус

### 2. Backend CI (backend-ci.yml)
**Триггер**: Изменения в `backend/**`

Выполняет:
- ✅ Lint (если настроен)
- ✅ Database migrations (PostgreSQL 15)
- ✅ Unit & Integration tests
- ✅ Coverage report (отправляется в Codecov)
- ✅ Security audit
- ✅ Build verification

**Требования**:
- Node.js 20
- PostgreSQL 15
- npm

### 3. Frontend CI (frontend-ci.yml)
**Триггер**: Изменения в `frontend/**`

Выполняет:
- ✅ Lint (если настроен)
- ✅ Tests (если настроены)
- ✅ Production build
- ✅ Build size check
- 📦 Upload build artifacts (7 дней)

**Требования**:
- Node.js 20
- npm

### 4. Security Scan (security.yml)
**Триггер**: 
- Расписание (каждый понедельник 9:00 UTC)
- Push на main
- Manual dispatch

Выполняет:
- 🔒 Trivy vulnerability scan
- 🔍 CodeQL analysis
- 📋 npm audit (backend + frontend)
- 📊 Dependency review (на PR)

### 5. Documentation (docs.yml)
**Триггер**: Изменения в `docs/**`

Выполняет:
- ✅ Validation OpenAPI spec
- 📚 Generate Swagger UI
- 🚀 Deploy to GitHub Pages

---

## Переменные окружения

### Backend Tests
```yaml
NODE_ENV: test
DB_HOST: localhost
DB_PORT: 5432
DB_NAME: hostprint_test
DB_USER: postgres
DB_PASSWORD: postgres
JWT_SECRET: test-jwt-secret
```

### Secrets (настроить в GitHub)
- `CODECOV_TOKEN` (опционально) — для Codecov coverage
- `GITHUB_TOKEN` — автоматически доступен

---

## Badges

Добавьте в README.md:

```markdown
![Backend CI](https://github.com/USERNAME/hostprint/workflows/Backend%20CI/badge.svg)
![Frontend CI](https://github.com/USERNAME/hostprint/workflows/Frontend%20CI/badge.svg)
![Security](https://github.com/USERNAME/hostprint/workflows/Security%20Scan/badge.svg)
```

---

## Локальная проверка

Перед push можно проверить локально:

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

---

## Troubleshooting

### Tests failing in CI but passing locally
- Проверьте переменные окружения
- Убедитесь что PostgreSQL запущен и доступен
- Проверьте версию Node.js

### Build artifacts not uploaded
- Проверьте что путь `frontend/dist/` существует
- Посмотрите логи build step

### Security scan false positives
- Проверьте конкретную уязвимость
- Обновите зависимости: `npm update`
- Добавьте исключения если нужно

---

## Оптимизация

### Cache
Workflows используют cache для npm dependencies:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json
```

### Matrix builds (будущее)
Можно добавить тестирование на разных версиях Node:
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
```

---

## Мониторинг

- **Actions tab**: все запуски workflows
- **Security tab**: результаты CodeQL и Trivy
- **Insights > Dependency graph**: уязвимости зависимостей
