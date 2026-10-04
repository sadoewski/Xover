# 🚀 Quick Reference — Hostprint Post-Refactor

**Commit:** 6ce9230  
**Status:** ✅ Production Ready  
**Date:** 2024-10-04

---

## 📋 Quick Commands

### Development

```bash
# Install dependencies (reproducible)
npm ci

# Run database migrations (idempotent)
npm run db:migrate

# Start backend (dev mode)
cd backend && npm start

# Start frontend (dev mode)
cd frontend && npm run dev
```

### Docker Production

```bash
# Build services
docker-compose build

# Start all services
docker-compose up -d

# Check health
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Database

```bash
# Run migrations
npm run db:migrate

# Connect to PostgreSQL
docker-compose exec db psql -U postgres -d hostprint

# Backup database
docker-compose exec db pg_dump -U postgres hostprint > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres hostprint < backup.sql
```

---

## 🔑 Environment Variables

### Backend (.env)

```bash
# Required Production Variables
DB_PASSWORD=your_secure_password_min_16_chars
JWT_SECRET=your_secure_jwt_secret_min_32_chars
ALLOWED_ORIGINS=https://yourdomain.com

# Optional (have defaults)
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_NAME=hostprint
PORT=5000
NODE_ENV=production
```

### Frontend (.env)

```bash
# Required
VITE_API_URL=https://api.yourdomain.com

# Optional
VITE_DEV_MODE=false
VITE_ENABLE_DEBUG=false
```

---

## 📊 What Changed (Summary)

### Database
- ✅ **Runtime DDL → Migrations**: 8 DDL calls eliminated
- ✅ **Migration system**: Versioned, transactional, idempotent
- ✅ **Clean bootstrap**: 22 tables created automatically
- ✅ **Schema fixes**: Added missing columns

### Security
- ✅ **IDOR protection**: user_id validation middleware
- ✅ **Upload hardening**: Crypto filenames, MIME whitelist
- ✅ **Secrets**: Moved to .env with .env.example templates
- ✅ **Network isolation**: PostgreSQL internal only

### Build
- ✅ **Reproducible builds**: npm ci in Dockerfiles
- ✅ **Node version**: Unified to 18.20.4
- ✅ **Lock files**: package-lock.json tracked

### API
- ✅ **Hardcoded URLs**: 10+ localhost:5001 → VITE_API_URL
- ✅ **API client**: Unified client.js
- ✅ **Path fixes**: /api/api/sites → /api/sites

---

## 🔍 Health Check Endpoints

```bash
# Backend health
curl http://localhost:5000/api/auth/health

# Frontend
curl http://localhost:80

# PostgreSQL (from backend container)
docker-compose exec backend pg_isready -h postgres
```

---

## 📁 Important Files

### Configuration
- `backend/.env` — Backend environment (copy from .env.example)
- `frontend/.env` — Frontend environment (copy from .env.example)
- `.nvmrc` — Node version (18.20.4)
- `docker-compose.yml` — Docker orchestration

### Migrations
- `backend/migrate.js` — Migration runner
- `backend/migrations/*.sql` — 5 ordered migrations

### API
- `frontend/src/api/client.js` — Unified API client
- `docs/openapi.yaml` — Complete API specification (76 endpoints)

### Documentation
- `REFACTOR_STATUS.md` — Current status of all tasks
- `REFACTOR_COMPLETE.md` — Summary
- `docs/refactor-final-report.md` — Detailed report
- `START_HERE.md` — Quick start guide

---

## ⚠️ Breaking Changes

### Database
**Migration required** — Old database will not work without migration.

```bash
npm run db:migrate
```

### Environment Variables
**New required variables:**
- `VITE_API_URL` in frontend/.env
- `ALLOWED_ORIGINS` in backend/.env (production)

### Docker
**docker-compose.yml changed:**
- PostgreSQL no longer exposed on :5432
- New volume: `uploads_data`
- Health checks added

---

## 🎯 Next Steps (P1 Recommended)

**Quick wins for production readiness:**

1. **Health endpoints** (20 min)
   ```javascript
   GET /health  → { status: "ok" }
   GET /ready   → { db: "ok", migrations: "applied" }
   ```

2. **Morphology hardening** (30 min)
   - Rate limit: 5 req/15min
   - Text size limit: 10KB

3. **Unified error format** (45 min)
   ```json
   { "error": { "code": "...", "message": "..." } }
   ```

4. **Integration tests** (2-3 hours)
   - Auth flow
   - Tasks CRUD
   - DataTasks CRUD

---

## 🚨 Common Issues

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
docker-compose ps

# Check backend .env has correct DB_HOST
DB_HOST=postgres  # (not localhost in Docker)
```

### "Migration already applied"
**This is normal!** Migrations are idempotent.
```bash
npm run db:migrate
# Output: "Нет новых миграций для применения"
```

### "CORS error in frontend"
```bash
# Check backend/.env has frontend URL
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Or check frontend/.env points to backend
VITE_API_URL=http://localhost:5000
```

### "Permission denied: uploads"
```bash
# Create uploads directory
mkdir -p backend/uploads/avatars

# Or use Docker volume (automatic)
docker-compose up -d
```

---

## 📞 Support

**Documentation:**
- Full report: `docs/refactor-final-report.md`
- Status tracker: `REFACTOR_STATUS.md`
- API docs: `docs/openapi.yaml`

**Original task list:**
- `refactor.md` — All tasks with priorities

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Copy `.env.example` → `.env` (backend & frontend)
- [ ] Set secure `DB_PASSWORD` (min 16 chars)
- [ ] Set secure `JWT_SECRET` (min 32 chars)
- [ ] Set `ALLOWED_ORIGINS` to production domains
- [ ] Set `VITE_API_URL` to production backend URL
- [ ] Run `npm run db:migrate`
- [ ] Test `docker-compose build`
- [ ] Test `docker-compose up -d`
- [ ] Verify health checks: `docker-compose ps`
- [ ] Set up PostgreSQL backups (daily recommended)
- [ ] Set up uploads volume backups
- [ ] Configure monitoring/logging

---

**Version:** 1.0.0-refactored  
**Last Updated:** 2024-10-04  
**Git Commit:** 6ce9230
