# 📋 Production Deployment Checklist — Hostprint

**Version:** 1.0.0-refactored  
**Date:** 2024-10-04  
**Commit:** 6ce9230

---

## ✅ Pre-Deployment

### 1. Environment Setup

#### Backend Environment
- [ ] `cp backend/.env.example backend/.env`
- [ ] Set `DB_PASSWORD` (minimum 16 characters, use password generator)
- [ ] Set `JWT_SECRET` (minimum 32 characters, use: `openssl rand -hex 32`)
- [ ] Set `ALLOWED_ORIGINS` (your production frontend domains)
- [ ] Set `NODE_ENV=production`
- [ ] Verify `DB_HOST=postgres` (for Docker) or actual host
- [ ] Set `PORT=5000` (or your preferred port)

#### Frontend Environment
- [ ] `cp frontend/.env.example frontend/.env`
- [ ] Set `VITE_API_URL` (your production backend URL)
- [ ] Set `VITE_DEV_MODE=false`
- [ ] Set `VITE_ENABLE_DEBUG=false`

---

### 2. Security Audit

- [ ] Verify `.env` files are NOT in git: `git status | grep .env`
- [ ] Verify `package-lock.json` IS in git (reproducible builds)
- [ ] Review CORS origins in backend/.env
- [ ] Confirm JWT expiration is appropriate (default: 7d)
- [ ] Verify PostgreSQL is NOT exposed: check docker-compose.yml ports section
- [ ] Confirm uploads directory exists: `mkdir -p backend/uploads/avatars`

---

### 3. Database

- [ ] PostgreSQL server is running
- [ ] Database `hostprint` exists (or will be created)
- [ ] User has CREATE TABLE permissions
- [ ] Run migrations: `npm run db:migrate`
- [ ] Verify all 22 tables created:
  ```sql
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```
- [ ] Create first admin user (manually or via seed script)

---

### 4. Build & Test

#### Local Testing
- [ ] Clean install: `rm -rf node_modules && npm ci`
- [ ] Run backend tests: `cd backend && npm test`
- [ ] Run frontend tests: `cd frontend && npm test`
- [ ] Start backend: `cd backend && npm start`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Test login flow
- [ ] Test API endpoints

#### Docker Testing
- [ ] Build services: `docker-compose build`
- [ ] Start services: `docker-compose up -d`
- [ ] Check health: `docker-compose ps` (all should be "Up (healthy)")
- [ ] Check logs: `docker-compose logs -f backend`
- [ ] Test frontend: `curl http://localhost:80`
- [ ] Test backend: `curl http://localhost:5000/api/auth/health`
- [ ] Stop services: `docker-compose down`

---

## 🚀 Deployment

### 5. Initial Deployment

#### Push to Registry (if using)
- [ ] Tag images: `docker tag hostprint-backend:latest registry.com/hostprint-backend:1.0.0`
- [ ] Push images: `docker push registry.com/hostprint-backend:1.0.0`
- [ ] Tag frontend: `docker tag hostprint-frontend:latest registry.com/hostprint-frontend:1.0.0`
- [ ] Push frontend: `docker push registry.com/hostprint-frontend:1.0.0`

#### Server Setup
- [ ] Copy `.env` files to production server
- [ ] Copy `docker-compose.yml` to production server
- [ ] Ensure Docker and Docker Compose are installed
- [ ] Pull images (if using registry)
- [ ] Create necessary directories: `mkdir -p backend/uploads/avatars`

#### Start Production
- [ ] `docker-compose up -d`
- [ ] Wait for health checks: `docker-compose ps`
- [ ] Verify all services are "Up (healthy)"
- [ ] Check logs: `docker-compose logs -f`

---

### 6. Post-Deployment Verification

#### Smoke Tests
- [ ] Frontend loads: `curl https://yourdomain.com`
- [ ] Backend health: `curl https://api.yourdomain.com/api/auth/health`
- [ ] Login works (manual test)
- [ ] Create task (manual test)
- [ ] Upload avatar (manual test)
- [ ] API returns correct CORS headers

#### Security Verification
- [ ] PostgreSQL is NOT accessible from internet: `nmap -p 5432 yourdomain.com`
- [ ] HTTPS is enforced (if applicable)
- [ ] JWT tokens expire correctly
- [ ] User cannot access other users' resources (IDOR test)
- [ ] File upload rejects malicious files

---

## 🔧 Operations

### 7. Monitoring Setup

- [ ] Configure log aggregation (ELK, Datadog, CloudWatch, etc.)
- [ ] Set up uptime monitoring (Pingdom, UptimeRobot, etc.)
- [ ] Configure alerts for:
  - [ ] Service down
  - [ ] High error rate
  - [ ] Database connection failures
  - [ ] Disk space low
- [ ] Set up APM (Application Performance Monitoring)

---

### 8. Backup Configuration

#### Database Backups
- [ ] Configure automated PostgreSQL backups:
  ```bash
  # Daily backup cron job
  0 2 * * * docker-compose exec -T db pg_dump -U postgres hostprint | gzip > /backups/hostprint-$(date +\%Y\%m\%d).sql.gz
  ```
- [ ] Test restore procedure:
  ```bash
  gunzip -c backup.sql.gz | docker-compose exec -T db psql -U postgres hostprint
  ```
- [ ] Set retention policy (e.g., keep 30 days)
- [ ] Store backups off-site (S3, Google Cloud Storage, etc.)

#### Uploads Backups
- [ ] Configure automated uploads volume backup:
  ```bash
  # Daily backup
  0 3 * * * docker run --rm -v hostprint_uploads_data:/data -v /backups:/backup alpine tar czf /backup/uploads-$(date +\%Y\%m\%d).tar.gz /data
  ```
- [ ] Test restore procedure
- [ ] Set retention policy

---

### 9. Scaling (if needed)

- [ ] Consider reverse proxy (Nginx, Traefik)
- [ ] Configure load balancer (if multiple backend instances)
- [ ] Set up Redis for session storage (if needed)
- [ ] Configure CDN for static assets
- [ ] Enable PostgreSQL read replicas (if read-heavy)

---

## 📊 Health Checks

### Service Health

```bash
# All services status
docker-compose ps

# Backend health
curl http://localhost:5000/api/auth/health

# PostgreSQL
docker-compose exec db pg_isready -U postgres

# Frontend
curl http://localhost:80
```

### Database Health

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 22

-- Check migrations
SELECT * FROM schema_migrations ORDER BY id;
-- Expected: 5 rows

-- Check users exist
SELECT COUNT(*) FROM users;
```

---

## 🆘 Rollback Plan

If deployment fails:

### Quick Rollback
```bash
# Stop new version
docker-compose down

# Revert to previous commit
git checkout <previous-commit>

# Restore database backup
gunzip -c /backups/hostprint-backup.sql.gz | docker-compose exec -T db psql -U postgres hostprint

# Start previous version
docker-compose up -d
```

### Database Rollback
**Note:** There is NO automatic migration rollback. Database rollback requires:
1. Stop application
2. Restore database from backup
3. Redeploy previous version

---

## 📝 Post-Deployment Notes

### What to Monitor

**First 24 hours:**
- [ ] Error rate in logs
- [ ] Response times
- [ ] Memory usage
- [ ] CPU usage
- [ ] Database connection pool
- [ ] Disk space

**First week:**
- [ ] User login success rate
- [ ] API error patterns
- [ ] Upload success rate
- [ ] Database query performance

---

### Known Limitations

- JWT tokens cannot be revoked (consider Redis blocklist if needed)
- File upload size limited to 5MB (configurable in upload.js)
- No rate limiting on most endpoints (P1 task)
- No health/ready endpoints (P1 task)
- Morphology endpoint not hardened (P1 task)

---

## 🎯 Recommended P1 Tasks

After stable deployment, implement:

1. **Health endpoints** (20 min)
   - `GET /health` → system status
   - `GET /ready` → database + migrations check

2. **Morphology hardening** (30 min)
   - Rate limit: 5 requests / 15 minutes
   - Text size limit: 10KB
   - Subprocess timeout: 5 seconds

3. **Unified error format** (45 min)
   - Consistent JSON error responses
   - Error codes

4. **Integration tests** (2-3 hours)
   - CI/CD pipeline
   - Automated testing

---

## ✅ Sign-Off

**Deployed by:** _________________  
**Date:** _________________  
**Version:** 1.0.0-refactored  
**Commit:** 6ce9230  

**Verified by:** _________________  
**Date:** _________________  

---

**Emergency Contacts:**
- DevOps: _________________
- Database Admin: _________________
- Security: _________________

**Links:**
- Monitoring Dashboard: _________________
- Logs Dashboard: _________________
- Status Page: _________________

---

*Last updated: 2024-10-04*
