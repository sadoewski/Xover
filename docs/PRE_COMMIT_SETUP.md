# Pre-commit Hooks Setup

## Установка

### 1. Установить husky

```bash
npm install -D husky
npx husky init
```

### 2. Создать pre-commit хук

Создайте файл `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Check if we're in backend or frontend
CHANGED_BACKEND=$(git diff --cached --name-only | grep "^backend/" || true)
CHANGED_FRONTEND=$(git diff --cached --name-only | grep "^frontend/" || true)

# Backend checks
if [ -n "$CHANGED_BACKEND" ]; then
  echo "📦 Backend files changed, running checks..."
  
  cd backend
  
  # Run tests
  echo "🧪 Running backend tests..."
  npm test || exit 1
  
  cd ..
fi

# Frontend checks
if [ -n "$CHANGED_FRONTEND" ]; then
  echo "🎨 Frontend files changed, running checks..."
  
  cd frontend
  
  # Check build
  echo "🏗️  Checking frontend build..."
  npm run build || exit 1
  
  cd ..
fi

echo "✅ Pre-commit checks passed!"
```

### 3. Сделать исполняемым

```bash
chmod +x .husky/pre-commit
```

## Альтернатива: lint-staged

Для более быстрых проверок только измененных файлов:

```bash
npm install -D lint-staged
```

Добавьте в `package.json`:

```json
{
  "lint-staged": {
    "backend/**/*.js": [
      "eslint --fix",
      "npm test --findRelatedTests"
    ],
    "frontend/**/*.{js,jsx}": [
      "eslint --fix"
    ]
  }
}
```

Обновите `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

## Пропуск хуков

Если нужно пропустить проверки:

```bash
git commit --no-verify -m "WIP: work in progress"
```

**⚠️ Используйте с осторожностью!**
