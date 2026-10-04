#!/bin/bash

echo "🐳 Тестирование Docker Compose"
echo "================================"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=()

echo "1️⃣ Проверка docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml не найден${NC}"
    ERRORS+=("docker-compose.yml не найден")
else
    echo -e "${GREEN}✅ docker-compose.yml найден${NC}"
fi

echo ""
echo "2️⃣ Проверка Dockerfile для backend..."
if [ ! -f "backend/Dockerfile" ]; then
    echo -e "${RED}❌ backend/Dockerfile не найден${NC}"
    ERRORS+=("backend/Dockerfile не найден")
else
    echo -e "${GREEN}✅ backend/Dockerfile найден${NC}"
fi

echo ""
echo "3️⃣ Проверка Dockerfile для frontend..."
if [ ! -f "frontend/Dockerfile" ]; then
    echo -e "${RED}❌ frontend/Dockerfile не найден${NC}"
    ERRORS+=("frontend/Dockerfile не найден")
else
    echo -e "${GREEN}✅ frontend/Dockerfile найден${NC}"
fi

echo ""
echo "4️⃣ Проверка миграций..."
if [ ! -d "backend/migrations" ]; then
    echo -e "${RED}❌ backend/migrations не найдена${NC}"
    ERRORS+=("backend/migrations не найдена")
else
    MIGRATION_COUNT=$(ls -1 backend/migrations/*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Найдено $MIGRATION_COUNT миграций${NC}"
fi

echo ""
echo "5️⃣ Проверка run-migrations.js..."
if [ ! -f "backend/run-migrations.js" ]; then
    echo -e "${RED}❌ backend/run-migrations.js не найден${NC}"
    ERRORS+=("run-migrations.js не найден")
else
    echo -e "${GREEN}✅ run-migrations.js найден${NC}"
fi

echo ""
echo "6️⃣ Проверка nginx.conf для frontend..."
if [ ! -f "frontend/nginx.conf" ]; then
    echo -e "${RED}❌ frontend/nginx.conf не найден${NC}"
    ERRORS+=("nginx.conf не найден")
else
    echo -e "${GREEN}✅ nginx.conf найден${NC}"
fi

echo ""
echo "7️⃣ Проверка .env.production для frontend..."
if [ ! -f "frontend/.env.production" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.production не найден (будет использован .env)${NC}"
else
    echo -e "${GREEN}✅ .env.production найден${NC}"
fi

echo ""
echo "================================"
echo ""

if [ ${#ERRORS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Все проверки пройдены!${NC}"
    echo ""
    echo "Готов к запуску:"
    echo -e "${YELLOW}docker-compose up -d${NC}"
    echo ""
    echo "Для просмотра логов:"
    echo -e "${YELLOW}docker-compose logs -f${NC}"
    echo ""
    echo "Для остановки:"
    echo -e "${YELLOW}docker-compose down${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Найдены ошибки (${#ERRORS[@]}):${NC}"
    for error in "${ERRORS[@]}"; do
        echo -e "${RED}  - $error${NC}"
    done
    echo ""
    exit 1
fi
