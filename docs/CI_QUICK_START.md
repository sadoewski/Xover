# CI/CD Quick Start

## 🚀 Первый запуск (5 минут)

### 1. Push код в GitHub

```bash
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin main
```

### 2. Проверить workflows

Перейти на GitHub:
```
https://github.com/USERNAME/hostprint/actions
```

Должны запуститься:
- ✅ Backend CI
- ✅ Frontend CI
- ✅ Security Scan

### 3. Проверить статус

Workflows должны завершиться успешно (~3-5 минут):
- 🟢 Backend CI: тесты + build
- 🟢 Frontend CI: build
- 🟢 Security: audit

---

## 📊 Включить Codecov (опционально)

### 1. Зарегистрироваться
```
https://codecov.io
→ Sign up with GitHub
→ Add repository
```

### 2. Получить токен
```
Codecov → Settings → Copy CODECOV_TOKEN
```

### 3. Добавить в GitHub
```
GitHub repo → Settings → Secrets and variables → Actions
→ New repository secret
Name: CODECOV_TOKEN
Value: <ваш токен>
```

### 4. Проверить
Push изменения → Actions → Backend CI → Coverage должен отправиться

---

## 📚 Включить GitHub Pages (документация)

### 1. Активировать Pages
```
GitHub repo → Settings → Pages
Source: Deploy from a branch
Branch: gh-pages
```

### 2. Push изменения в docs/
```bash
git add docs/openapi.yaml
git commit -m "docs: update API spec"
git push origin main
```

### 3. Проверить
```
https://USERNAME.github.io/hostprint/
```

Swagger UI должен показать OpenAPI spec

---

## 🔒 Security Scanning

### CodeQL (автоматически включен)

Проверить результаты:
```
GitHub repo → Security → Code scanning alerts
```

### Dependabot (уже настроен)

Проверить:
```
GitHub repo → Security → Dependabot alerts
```

Dependabot создаст PR для обновления зависимостей (каждый понедельник)

---

## ✅ Checklist первого запуска

- [ ] Push код в GitHub
- [ ] Проверить Actions → все workflows зеленые
- [ ] (Опционально) Настроить Codecov
- [ ] (Опционально) Включить GitHub Pages
- [ ] Проверить Security tab → нет критичных issues
- [ ] Добавить badges в README

---

## 🏷️ Badges для README

Добавьте в ваш README.md:

```markdown
[![Backend CI](https://github.com/USERNAME/hostprint/workflows/Backend%20CI/badge.svg)](https://github.com/USERNAME/hostprint/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/USERNAME/hostprint/workflows/Frontend%20CI/badge.svg)](https://github.com/USERNAME/hostprint/actions/workflows/frontend-ci.yml)
[![Security](https://github.com/USERNAME/hostprint/workflows/Security%20Scan/badge.svg)](https://github.com/USERNAME/hostprint/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/USERNAME/hostprint/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/hostprint)
```

Замените `USERNAME` на ваш GitHub username.

---

## 🐛 Troubleshooting

### Backend CI не проходит

**Симптом:** Tests fail, PostgreSQL connection error

**Решение:**
1. Проверить `.github/workflows/backend-ci.yml`
2. Убедиться что PostgreSQL service настроен:
```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_DB: hostprint_test
```

### Frontend CI не проходит

**Симптом:** Build fails

**Решение:**
1. Проверить локально: `cd frontend && npm run build`
2. Проверить Node.js версию в workflow (должна быть 20)

### Security scan находит уязвимости

**Решение:**
1. Обновить зависимости: `npm update`
2. Для критичных: `npm audit fix`
3. Проверить: `npm audit`

---

## 📖 Дальше читать

- [CI/CD полная документация](CI_CD.md)
- [Contributing guide](../CONTRIBUTING.md)
- [Workflows README](.github/workflows/README.md)

---

**Готово!** 🎉 Ваш CI/CD pipeline работает!
