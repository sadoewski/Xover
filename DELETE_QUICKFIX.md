# 🚨 Быстрое исправление DELETE на деплое

## Проблема
На продакшн не работает удаление (задачи, приоритеты, документы и т.д.)

## Быстрое решение

### 1. Пересоберите Docker контейнеры

```bash
cd /path/to/hostprint

# Остановите контейнеры
docker-compose down

# Пересоберите БЕЗ кэша
docker-compose build --no-cache frontend backend

# Запустите заново
docker-compose up -d

# Проверьте логи
docker-compose logs -f
```

### 2. Проверьте что работает

Откройте приложение в браузере:
1. Нажмите F12 → Network
2. Попробуйте удалить любой элемент
3. Найдите DELETE запрос
4. Должен быть статус **200 OK**

### 3. Если всё ещё не работает

```bash
# Запустите тестовый скрипт
./test-delete.sh http://your-domain.com/api

# Или с токеном
./test-delete.sh http://your-domain.com/api "your-jwt-token"
```

### 4. Проверьте переменные окружения

**backend/.env**:
```env
# Добавьте ваш домен
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
```

После изменения .env:
```bash
docker-compose restart backend
```

## Что было исправлено

✅ `frontend/nginx.conf` - разрешены DELETE/PUT/PATCH методы  
✅ `backend/src/index.js` - правильные CORS заголовки  
✅ Обработка OPTIONS preflight запросов  
✅ Увеличены таймауты и буферы  

## Частые проблемы

### 405 Method Not Allowed
→ Nginx блокирует DELETE. Убедитесь что пересобрали контейнер frontend:
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### CORS Error
→ Неправильно настроен ALLOWED_ORIGINS. Проверьте backend/.env:
```bash
docker-compose exec backend cat .env | grep ALLOWED_ORIGINS
```

### 403 Forbidden
→ Проблема с авторизацией. Проверьте токен в localStorage:
```javascript
// В консоли браузера
console.log(localStorage.getItem('token'));
```

### Всё ещё не работает?
→ Возможно ваш хостинг блокирует DELETE на уровне сервера.
   Смотрите альтернативные решения в `DELETE_FIX.md`

## Полная документация

Детали в файлах:
- `DELETE_FIX.md` - полное описание проблемы и решений
- `test-delete.sh` - скрипт для тестирования
- `CHANGELOG.md` - список изменений

## Помощь

Если проблема не решается:
1. Сохраните HAR файл (Network tab → Export HAR)
2. Сохраните логи: `docker-compose logs > logs.txt`
3. Опишите хостинг и конфигурацию
