# Исправление проблемы с удалением на деплое

## Проблема
На продакшн деплое (Docker) не работает удаление элементов:
- Задачи (tasks)
- Документы (datatasks)
- Приоритеты (priorities)
- Группы (groups)
- События (events)
- И другие элементы с кнопкой "Удалить"

## Причина
Nginx по умолчанию не проксирует DELETE запросы правильно, а также не установлены правильные CORS заголовки для всех HTTP методов.

## Исправление

### 1. Обновлён `frontend/nginx.conf`
Добавлены:
- Явное разрешение методов DELETE, PUT, PATCH
- Обработка OPTIONS preflight запросов
- Правильные proxy заголовки
- Увеличенные таймауты и размеры буферов

### 2. Обновлён `backend/src/index.js`
Добавлены:
- Явное указание разрешённых методов в CORS
- Правильные заголовки для всех типов запросов
- MaxAge для кэширования preflight запросов

## Как применить исправление

### Для Docker деплоя:

1. Пересоберите контейнеры:
```bash
docker-compose down
docker-compose build --no-cache frontend backend
docker-compose up -d
```

2. Проверьте логи:
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Для обычного деплоя:

1. Обновите nginx конфигурацию:
```bash
# Скопируйте обновлённый nginx.conf
sudo cp frontend/nginx.conf /etc/nginx/sites-available/hostprint
sudo nginx -t
sudo systemctl reload nginx
```

2. Перезапустите backend:
```bash
cd backend
npm install
pm2 restart hostprint-backend
```

## Проверка исправления

После применения проверьте в браузере:

### 1. Откройте DevTools (F12) → Network

### 2. Попробуйте удалить элемент

### 3. Проверьте запрос DELETE:
- **Status**: должен быть 200 OK
- **Method**: должен быть DELETE
- **Headers → Response Headers**: 
  - `Access-Control-Allow-Methods` должен содержать DELETE
  - `Access-Control-Allow-Origin` должен быть установлен

### 4. Если видите ошибки:

#### CORS Error
```
Access to XMLHttpRequest at 'http://...' from origin 'http://...' 
has been blocked by CORS policy
```
**Решение**: Проверьте ALLOWED_ORIGINS в .env backend

#### 405 Method Not Allowed
```
HTTP/1.1 405 Method Not Allowed
```
**Решение**: Nginx не пропускает DELETE. Проверьте nginx.conf

#### 403 Forbidden
```
HTTP/1.1 403 Forbidden
```
**Решение**: Проблема с правами или CORS. Проверьте обе конфигурации

## Тестирование через curl

Можете протестировать напрямую:

```bash
# Получите токен
TOKEN="your-jwt-token-here"

# Попробуйте DELETE запрос
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://your-domain.com/api/priorities/123

# Должен вернуться:
{"message":"Запись удалена"}
```

## Дополнительные проверки

### 1. Проверьте переменные окружения

**backend/.env**:
```env
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
```

**frontend/.env.production**:
```env
VITE_API_URL=/api
```

### 2. Проверьте Docker Compose

Убедитесь что порты правильно проброшены:
```yaml
frontend:
  ports:
    - "3000:80"
backend:
  ports:
    - "5001:5000"
```

### 3. Проверьте файрволл

Если используете ufw/iptables, убедитесь что разрешены нужные порты:
```bash
sudo ufw allow 3000
sudo ufw allow 5001
sudo ufw status
```

## Альтернативное решение (если основное не помогло)

Если проблема всё ещё есть, возможно nginx вашего хостинга блокирует DELETE.

### Вариант 1: Использовать POST с методом в теле

**Backend маршрут**:
```javascript
router.post('/:id/delete', authMiddleware, controller.deleteItem);
```

**Frontend**:
```javascript
deleteItem: async (id) => {
  const response = await api.post(`/items/${id}/delete`);
  return response.data;
}
```

### Вариант 2: Использовать X-HTTP-Method-Override

**Nginx**:
```nginx
location /api {
    if ($http_x_http_method_override) {
        set $method $http_x_http_method_override;
    }
    proxy_method $method;
    proxy_pass http://backend:5000;
}
```

**Frontend**:
```javascript
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Для хостингов которые блокируют DELETE
  transformRequest: [(data, headers) => {
    if (headers['X-HTTP-Method-Override']) {
      return data;
    }
    return data;
  }],
});

// При DELETE запросе
api.delete('/items/1', {
  headers: {
    'X-HTTP-Method-Override': 'DELETE'
  }
});
```

## Проверка работоспособности

После применения исправлений проверьте:

✅ Удаление задач работает  
✅ Удаление приоритетов работает  
✅ Удаление групп работает  
✅ Удаление событий работает  
✅ Удаление документов работает  
✅ Нет CORS ошибок в консоли  
✅ Нет 405 ошибок в Network  

## Логи для отладки

### Backend логи:
```bash
docker-compose logs -f backend | grep -i "delete\|error\|cors"
```

### Nginx логи:
```bash
docker-compose exec frontend tail -f /var/log/nginx/error.log
docker-compose exec frontend tail -f /var/log/nginx/access.log
```

### Browser Console:
Откройте DevTools → Console и проверьте на ошибки при удалении

## Контрольный чеклист

- [ ] Обновлён `frontend/nginx.conf`
- [ ] Обновлён `backend/src/index.js`
- [ ] Пересобраны Docker контейнеры
- [ ] Проверены ALLOWED_ORIGINS в .env
- [ ] Протестировано удаление в браузере
- [ ] Проверены логи на ошибки
- [ ] Network tab показывает 200 OK для DELETE
- [ ] Нет CORS ошибок

## Известные проблемы хостингов

### Shared хостинг
Некоторые shared хостинги блокируют DELETE на уровне Apache/Nginx. 
**Решение**: Используйте VPS или альтернативные варианты выше.

### Cloudflare
Если используете Cloudflare, убедитесь что:
- Отключен "I'm Under Attack" режим
- В настройках WAF разрешены DELETE запросы

### AWS/Azure/GCP
Проверьте Security Groups и разрешите HTTP методы DELETE, PUT, PATCH

## Поддержка

Если проблема не решается:
1. Сохраните HAR файл из Network tab (правый клик → Save all as HAR)
2. Сохраните логи backend и nginx
3. Опишите хостинг и конфигурацию сервера
