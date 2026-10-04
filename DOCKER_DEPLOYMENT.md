# 🚀 Docker Deployment Guide

## ✅ Security Improvements Applied

Этот гайд описывает безопасную production-ready конфигурацию Docker.

---

## 🔒 Security Changes

### 1. ✅ PostgreSQL Network Isolation

**До:**
```yaml
ports:
  - "5432:5432"  # ❌ База exposed на host
```

**После:**
```yaml
# ✅ ports удалены — база доступна только внутри Docker network
networks:
  - hostprint-network
```

**Результат:**
- PostgreSQL доступен только для backend контейнера
- Невозможно подключиться к БД с host машины
- Защита от external connections

### 2. ✅ Environment Variables via .env

**До:**
```yaml
environment:
  POSTGRES_PASSWORD: postgres          # ❌ Hardcoded в git
  JWT_SECRET: akhlwhfklaewhf...       # ❌ Hardcoded в git
```

**После:**
```yaml
env_file:
  - .env  # ✅ Secrets в .env (не в git)
```

**Результат:**
- Secrets не хранятся в git
- Каждый environment использует свои credentials
- .env в .gitignore

### 3. ✅ Persistent Uploads Volume

**До:**
```dockerfile
RUN mkdir -p uploads  # ❌ Ephemeral — теряется при restart
```

**После:**
```yaml
volumes:
  - uploads_data:/app/uploads  # ✅ Persistent volume
```

**Результат:**
- Uploads (avatars, files) сохраняются при restart
- Нет потери данных при обновлении контейнера
- Backup volume отдельно от кода

### 4. ✅ Isolated Docker Network

**Добавлено:**
```yaml
networks:
  hostprint-network:
    driver: bridge
```

**Результат:**
- Все сервисы в изолированной сети
- Контроль коммуникации между контейнерами
- Дополнительный уровень безопасности

---

## 📋 Deployment Instructions

### Initial Setup

#### 1. Clone repository
```bash
git clone <repository-url>
cd hostprint
```

#### 2. Create .env file
```bash
cp .env.example .env
```

#### 3. Generate secure secrets

**ВАЖНО:** Не используйте defaults из .env.example в production!

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generate DB password:**
```bash
openssl rand -base64 16
```

**Update .env:**
```bash
nano .env

# Замените:
POSTGRES_PASSWORD=<generated_password>
DB_PASSWORD=<same_generated_password>
JWT_SECRET=<generated_secret>
ALLOWED_ORIGINS=https://your-domain.com
```

#### 4. Build and start
```bash
docker-compose up -d --build
```

#### 5. Verify deployment
```bash
# Check containers
docker-compose ps

# Check logs
docker-compose logs -f backend

# Verify migrations
docker-compose exec backend npm run db:migrate
```

---

## 🔄 Updates & Maintenance

### Update application
```bash
# Pull latest code
git pull

# Rebuild and restart (preserves data)
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### Backup data

**PostgreSQL:**
```bash
docker-compose exec db pg_dump -U postgres hostprint > backup_$(date +%Y%m%d).sql
```

**Uploads:**
```bash
docker run --rm -v hostprint_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
```

### Restore from backup

**PostgreSQL:**
```bash
cat backup_20261004.sql | docker-compose exec -T db psql -U postgres hostprint
```

**Uploads:**
```bash
docker run --rm -v hostprint_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads_20261004.tar.gz -C /data
```

---

## 🐛 Troubleshooting

### PostgreSQL connection issues

**Problem:** Backend не может подключиться к БД

**Solution:**
```bash
# Check DB health
docker-compose exec db pg_isready -U postgres

# Check network
docker network inspect hostprint_hostprint-network

# Verify env vars
docker-compose exec backend env | grep DB_
```

### Uploads not persisting

**Problem:** Загруженные файлы теряются при restart

**Solution:**
```bash
# Check volume exists
docker volume ls | grep uploads

# Inspect volume
docker volume inspect hostprint_uploads_data

# Verify mount
docker-compose exec backend ls -la /app/uploads
```

### Access PostgreSQL from host (for debugging)

**ВНИМАНИЕ:** Только для debugging, не для production!

**Temporary access:**
```bash
# 1. Expose port временно
docker-compose exec db psql -U postgres hostprint

# 2. Или создайте SSH tunnel через backend
docker-compose exec -it backend sh
psql -h db -U postgres -d hostprint
```

---

## 🌐 Production Deployment

### Nginx Reverse Proxy

**Recommended setup:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        proxy_pass http://localhost:5000;
    }
}
```

### SSL/TLS

**Using Let's Encrypt:**
```bash
certbot --nginx -d your-domain.com
```

### Update .env for production
```bash
ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production
```

---

## 📊 Monitoring

### Container health
```bash
docker-compose ps
docker stats
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database stats
```bash
docker-compose exec db psql -U postgres -d hostprint -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## 🔐 Security Checklist

### Before production deployment

- [ ] ✅ Generated strong POSTGRES_PASSWORD (16+ characters)
- [ ] ✅ Generated strong JWT_SECRET (64+ hex characters)
- [ ] ✅ Updated ALLOWED_ORIGINS to production domain
- [ ] ✅ Verified .env is in .gitignore
- [ ] ✅ Verified PostgreSQL ports NOT exposed
- [ ] ✅ Configured SSL/TLS (HTTPS)
- [ ] ✅ Set up firewall rules
- [ ] ✅ Configured backup schedule
- [ ] ✅ Set up monitoring/logging

---

## 📦 Volumes

| Volume | Purpose | Backup Priority |
|--------|---------|-----------------|
| `postgres_data` | Database | **CRITICAL** — daily |
| `uploads_data` | User files (avatars) | **HIGH** — daily |

**Location:**
```bash
# Inspect volume location
docker volume inspect hostprint_postgres_data
docker volume inspect hostprint_uploads_data
```

**Default location:** `/var/lib/docker/volumes/`

---

## 🚨 Emergency Procedures

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Database corruption

```bash
# Stop services
docker-compose down

# Restore from backup
cat backup.sql | docker-compose run --rm db psql -U postgres hostprint

# Start services
docker-compose up -d
```

### Reset everything (DATA LOSS!)

```bash
# ⚠️ WARNING: Deletes ALL data
docker-compose down -v
docker-compose up -d --build
```

---

## 📝 Migration Commands

```bash
# Apply pending migrations
docker-compose exec backend npm run db:migrate

# Check migration status
docker-compose exec backend psql -h db -U postgres -d hostprint -c "SELECT * FROM schema_migrations ORDER BY applied_at DESC;"
```

---

## Performance Tuning

### PostgreSQL
```bash
# Increase max connections (if needed)
docker-compose exec db sh -c "echo 'max_connections = 200' >> /var/lib/postgresql/data/postgresql.conf"
docker-compose restart db
```

### Memory limits
```yaml
# In docker-compose.yml
services:
  db:
    mem_limit: 512m  # Increase if needed
  backend:
    mem_limit: 256m
```

---

**Security status:** ✅ Production-ready  
**Last updated:** 4 октября 2026
