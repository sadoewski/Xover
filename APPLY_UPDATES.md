# 🚀 Применение обновлений - Инструкция

## Что нового

1. **📱 Мобильная адаптация** - приложение теперь работает на телефонах и планшетах
2. **🐛 Исправлено удаление** - DELETE запросы теперь работают на деплое

## Применение обновлений

### Вариант 1: Docker (РЕКОМЕНДУЕТСЯ)

```bash
# 1. Перейдите в папку проекта
cd /path/to/hostprint

# 2. Получите последние изменения
git pull

# 3. Остановите контейнеры
docker-compose down

# 4. Пересоберите БЕЗ КЭША (важно!)
docker-compose build --no-cache

# 5. Запустите
docker-compose up -d

# 6. Проверьте логи
docker-compose logs -f
```

### Вариант 2: Без Docker

#### Backend:
```bash
cd backend
git pull
npm install
pm2 restart hostprint-backend
```

#### Frontend:
```bash
cd frontend
git pull
npm install
npm run build

# Скопируйте dist в nginx
sudo cp -r dist/* /var/www/hostprint/
sudo cp nginx.conf /etc/nginx/sites-available/hostprint

# Перезагрузите nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Проверка работоспособности

### 1. Мобильная версия

На телефоне откройте: `http://ваш-сервер:3000`

Должно работать:
- ✅ Меню открывается по кнопке ☰
- ✅ Всё влезает в экран
- ✅ Формы не зумятся при фокусе (iOS)
- ✅ Таблицы прокручиваются горизонтально

### 2. Удаление элементов

В браузере:
1. Откройте F12 → Network
2. Попробуйте удалить задачу/приоритет
3. Найдите DELETE запрос
4. Должен быть **200 OK**

Или запустите тест:
```bash
./test-delete.sh http://ваш-домен.com/api
```

## Если что-то не работает

### DELETE не работает:

```bash
# Проверьте что пересобрали БЕЗ кэша
docker-compose build --no-cache frontend backend
docker-compose up -d

# Проверьте ALLOWED_ORIGINS
docker-compose exec backend cat .env | grep ALLOWED_ORIGINS

# Должно быть:
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
```

Подробности: `DELETE_QUICKFIX.md`

### Мобильная версия не открывается:

```bash
# Проверьте что порт 3000 открыт
sudo ufw allow 3000
sudo ufw status

# Узнайте IP сервера
ifconfig | grep "inet "

# Откройте на телефоне
http://[IP]:3000
```

Подробности: `MOBILE_QUICKSTART.md`

## Документация

- 📱 `MOBILE_ADAPTATION.md` - техническая документация мобильной версии
- 📱 `MOBILE_QUICKSTART.md` - быстрый старт для пользователей
- 🐛 `DELETE_FIX.md` - полное описание исправления DELETE
- 🐛 `DELETE_QUICKFIX.md` - быстрое решение DELETE
- 📋 `CHANGELOG.md` - полный список изменений
- 📊 `UPDATE_SUMMARY.md` - итоги всех изменений

## Быстрый тест

```bash
# 1. Проверьте что контейнеры запущены
docker-compose ps

# 2. Проверьте логи на ошибки
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error

# 3. Протестируйте DELETE
./test-delete.sh http://localhost:5001/api

# 4. Откройте на телефоне
# http://[IP-сервера]:3000
```

## Rollback (если нужно откатиться)

```bash
# Откатите git
git checkout [предыдущий-коммит]

# Пересоберите
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

**Важно:** После применения обновлений обязательно протестируйте:
1. Удаление элементов (задачи, приоритеты, группы)
2. Открытие на мобильном устройстве
3. Проверьте консоль браузера на ошибки

Если возникли проблемы - смотрите соответствующие .md файлы или проверьте логи.
