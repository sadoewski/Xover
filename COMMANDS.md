# Quick Commands Reference

## 🚀 Development

```bash
# Install all dependencies
npm run install:all

# Start backend (port 5001)
npm run dev:backend

# Start frontend (port 3000)  
npm run dev:frontend

# Start both
npm run dev
```

## 🧪 Testing

```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# All tests with coverage
npm run test:all

# Watch mode (backend)
cd backend && npm run test:watch
```

## 🔍 CI Check (before push)

```bash
# Run same checks as CI
npm run ci:check

# Or manually:
./scripts/pre-push-check.sh
```

## 🗄️ Database

```bash
# Run migrations
npm run db:migrate

# Reset database
npm run db:reset

# Direct psql access
psql -h localhost -U postgres -d hostprint
```

## 🐳 Docker

```bash
# Build all services
npm run docker:build

# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Check health
docker-compose ps
```

## 🔧 Backend Specific

```bash
cd backend

# Development with auto-reload
npm run dev

# Start server
npm start

# Run migrations
npm run db:migrate

# Tests
npm test
npm run test:watch
npm run test:coverage
```

## 🎨 Frontend Specific

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation

```bash
# Generate badges
./scripts/generate-badges.sh YOUR_GITHUB_USERNAME

# Validate OpenAPI spec (requires swagger-cli)
swagger-cli validate docs/openapi.yaml
```

## 🔒 Security

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Backend only
cd backend && npm audit

# Frontend only
cd frontend && npm audit
```

## 🏷️ Git

```bash
# Conventional commits
git commit -m "feat(backend): add new feature"
git commit -m "fix(frontend): resolve bug"
git commit -m "docs: update README"
git commit -m "test: add integration tests"

# Create PR
git push origin feature/your-branch
# Then create PR on GitHub
```

## 📊 Monitoring

```bash
# Health check
curl http://localhost:5001/health

# Readiness check
curl http://localhost:5001/ready

# Liveness check
curl http://localhost:5001/live

# Morphology stats
curl http://localhost:5001/api/morphology/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ Utilities

```bash
# Kill process on port
lsof -ti:5001 | xargs kill -9

# Check port
lsof -i:5001

# Find Node processes
ps aux | grep node

# PostgreSQL status
pg_isready -h localhost

# PostgreSQL start (macOS)
brew services start postgresql@15

# PostgreSQL stop (macOS)
brew services stop postgresql@15
```

## 📦 Package Management

```bash
# Install new dependency (backend)
cd backend && npm install package-name

# Install dev dependency
npm install -D package-name

# Update dependencies
npm update

# Clean install (reproducible)
npm ci

# Remove node_modules
rm -rf node_modules && npm install
```

## 🔄 CI/CD

```bash
# View GitHub Actions locally (requires act)
act -l

# Run workflow locally
act push

# Check workflow syntax
yamllint .github/workflows/*.yml
```

## 🐛 Debugging

```bash
# Backend logs
cd backend && npm start

# Frontend logs
cd frontend && npm run dev

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Database logs
docker-compose logs -f db

# All logs
docker-compose logs -f
```

## 📈 Performance

```bash
# Build size (frontend)
cd frontend && npm run build
du -sh dist/

# Test performance
time npm test

# PostgreSQL query stats
psql -h localhost -U postgres -d hostprint -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"
```

## 🧹 Cleanup

```bash
# Remove all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove coverage
rm -rf backend/coverage frontend/coverage

# Remove build artifacts
rm -rf frontend/dist frontend/build

# Docker cleanup
docker-compose down -v
docker system prune -a
```

## 🚀 Deployment

```bash
# 1. Build
npm run docker:build

# 2. Test locally
npm run docker:up
curl http://localhost:5001/health

# 3. Push to registry (example)
docker tag hostprint-backend:latest registry.io/hostprint-backend:v1.0.0
docker push registry.io/hostprint-backend:v1.0.0

# 4. Deploy (example with kubectl)
kubectl apply -f k8s/deployment.yml
kubectl rollout status deployment/hostprint-backend
```

## 📝 Common Workflows

### Starting new feature
```bash
git checkout -b feature/my-feature
npm run dev
# ... develop ...
npm run ci:check
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
# Create PR on GitHub
```

### Fixing a bug
```bash
git checkout -b fix/bug-description
# ... fix bug ...
npm run test:backend
npm run ci:check
git commit -m "fix: resolve bug description"
git push origin fix/bug-description
```

### Running full test suite
```bash
# 1. Start database
docker-compose up -d db

# 2. Run migrations
npm run db:migrate

# 3. Run tests
npm run test:all

# 4. Check coverage
open backend/coverage/lcov-report/index.html
```

### Pre-deployment checklist
```bash
# 1. All tests pass
npm run test:all

# 2. CI checks pass
npm run ci:check

# 3. Build succeeds
npm run build

# 4. Docker builds
npm run docker:build

# 5. Security audit
npm audit

# 6. Migration ready
npm run db:migrate

# 7. Health checks work
curl http://localhost:5001/health
```

---

**Tip:** Add these to your shell aliases in `~/.zshrc` or `~/.bashrc`:

```bash
alias hp-dev="cd ~/projects/hostprint && npm run dev"
alias hp-test="cd ~/projects/hostprint && npm run test:all"
alias hp-ci="cd ~/projects/hostprint && npm run ci:check"
alias hp-docker-up="cd ~/projects/hostprint && npm run docker:up"
alias hp-docker-down="cd ~/projects/hostprint && npm run docker:down"
```
