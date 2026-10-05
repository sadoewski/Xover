#!/bin/bash

# Скрипт для тестирования DELETE запросов на деплое
# Использование: ./test-delete.sh [URL] [TOKEN]

set -e

# Параметры
API_URL="${1:-http://localhost:5001/api}"
TOKEN="${2}"

echo "🧪 Тестирование DELETE запросов"
echo "================================"
echo "API URL: $API_URL"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки токена
check_token() {
    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}⚠️  Токен не указан. Попробуйте сначала залогиниться:${NC}"
        echo ""
        read -p "Username: " USERNAME
        read -sp "Password: " PASSWORD
        echo ""

        RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

        TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

        if [ -z "$TOKEN" ]; then
            echo -e "${RED}❌ Ошибка авторизации${NC}"
            echo "Response: $RESPONSE"
            exit 1
        fi

        echo -e "${GREEN}✅ Авторизация успешна${NC}"
        echo "Token: ${TOKEN:0:20}..."
        echo ""
    fi
}

# Тест OPTIONS запроса (preflight)
test_options() {
    echo "1️⃣  Тестирование OPTIONS (preflight)..."

    RESPONSE=$(curl -s -i -X OPTIONS "$API_URL/priorities/999" \
        -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: DELETE" \
        -H "Access-Control-Request-Headers: Authorization, Content-Type")

    if echo "$RESPONSE" | grep -q "Access-Control-Allow-Methods.*DELETE"; then
        echo -e "${GREEN}✅ OPTIONS: DELETE метод разрешён${NC}"
    else
        echo -e "${RED}❌ OPTIONS: DELETE метод НЕ разрешён${NC}"
        echo "Response:"
        echo "$RESPONSE"
    fi
    echo ""
}

# Тест DELETE запроса на несуществующий ресурс (должен вернуть 404)
test_delete_notfound() {
    echo "2️⃣  Тестирование DELETE на несуществующий ресурс..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X DELETE "$API_URL/priorities/99999" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")

    if [ "$HTTP_CODE" = "404" ]; then
        echo -e "${GREEN}✅ DELETE запрос работает (получен 404 как ожидалось)${NC}"
    elif [ "$HTTP_CODE" = "405" ]; then
        echo -e "${RED}❌ DELETE запрос заблокирован (405 Method Not Allowed)${NC}"
        echo -e "${YELLOW}   Проблема в Nginx конфигурации${NC}"
    elif [ "$HTTP_CODE" = "403" ]; then
        echo -e "${RED}❌ DELETE запрос запрещён (403 Forbidden)${NC}"
        echo -e "${YELLOW}   Проблема с CORS или правами доступа${NC}"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo -e "${RED}❌ Неверный токен (401 Unauthorized)${NC}"
    else
        echo -e "${YELLOW}⚠️  Неожиданный код ответа: $HTTP_CODE${NC}"
    fi
    echo ""
}

# Тест создания и удаления тестового приоритета
test_create_and_delete() {
    echo "3️⃣  Тестирование создания и удаления приоритета..."

    # Создаём тестовый приоритет
    CREATE_RESPONSE=$(curl -s -X POST "$API_URL/priorities" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"TEST_DELETE","level":999,"color":"#FF0000"}')

    PRIORITY_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    if [ -z "$PRIORITY_ID" ]; then
        echo -e "${YELLOW}⚠️  Не удалось создать тестовый приоритет${NC}"
        echo "Response: $CREATE_RESPONSE"
        return
    fi

    echo -e "${GREEN}✅ Создан тестовый приоритет ID: $PRIORITY_ID${NC}"

    # Удаляем созданный приоритет
    DELETE_RESPONSE=$(curl -s -i -X DELETE "$API_URL/priorities/$PRIORITY_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")

    HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP" | awk '{print $2}')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ DELETE успешно выполнен (200 OK)${NC}"
        echo -e "${GREEN}🎉 Удаление работает корректно!${NC}"
    else
        echo -e "${RED}❌ DELETE не выполнен (код: $HTTP_CODE)${NC}"
        echo "Response:"
        echo "$DELETE_RESPONSE"
    fi
    echo ""
}

# Тест CORS заголовков
test_cors() {
    echo "4️⃣  Тестирование CORS заголовков..."

    RESPONSE=$(curl -s -i -X DELETE "$API_URL/priorities/999" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Origin: http://localhost:3000" \
        -H "Content-Type: application/json")

    if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✅ CORS заголовки присутствуют${NC}"
    else
        echo -e "${RED}❌ CORS заголовки отсутствуют${NC}"
    fi

    if echo "$RESPONSE" | grep -q "Access-Control-Allow-Credentials"; then
        echo -e "${GREEN}✅ Credentials разрешены${NC}"
    else
        echo -e "${YELLOW}⚠️  Credentials не настроены${NC}"
    fi
    echo ""
}

# Запуск всех тестов
main() {
    check_token
    test_options
    test_delete_notfound
    test_create_and_delete
    test_cors

    echo "================================"
    echo "✅ Тестирование завершено"
    echo ""
    echo "Если DELETE не работает:"
    echo "1. Проверьте nginx.conf (должны быть разрешены все методы)"
    echo "2. Проверьте CORS настройки в backend/src/index.js"
    echo "3. Проверьте ALLOWED_ORIGINS в .env"
    echo "4. Пересоберите Docker контейнеры"
    echo ""
    echo "Подробности в DELETE_FIX.md"
}

main
