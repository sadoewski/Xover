# 🚀 Запуск локального backend для тестирования

## Вариант 1: Быстрый запуск (рекомендуется)

Просто запусти скрипт:

```bash
cd /Users/sadoewski/projects/hostprint
chmod +x start-local-backend.sh
./start-local-backend.sh
```

Backend запустится на **http://localhost:5001**

## Вариант 2: Ручной запуск

### Шаг 1: Запусти backend

```bash
cd /Users/sadoewski/projects/hostprint/backend
npm run dev
```

Backend запустится на порту **5001** (по умолчанию)

### Шаг 2: Настрой macOS приложение

В десктопном приложении Xover:

1. **Откройте Settings (⌘,)**
2. Перейдите в таб **Server**
3. Измените настройки:
   - **Server URL**: `http://localhost:5001`
   - **Auto-start local backend**: выключить (мы запустили вручную)
4. Нажмите **Save**
5. **Перезапустите приложение**

### Шаг 3: Залогинься

Используй свои обычные учетные данные - локальная БД использует ту же структуру.

## 📊 Проверка что backend работает

Открой в браузере или через curl:

```bash
# Проверка health endpoint
curl http://localhost:5001/api/health

# Должно вернуть что-то типа:
# {"status":"ok"}
```

## 🔍 Логи backend

Все логи будут видны в терминале где запущен `npm run dev`

## 🛑 Остановка backend

Нажми `Ctrl+C` в терминале где запущен backend

## 🗄️ База данных

Backend использует **SQLite** базу данных:
- Файл: `/Users/sadoewski/projects/hostprint/backend/database.sqlite`
- Если нужна чистая БД: удали файл и запусти миграции:
  ```bash
  cd /Users/sadoewski/projects/hostprint/backend
  rm database.sqlite
  npm run db:migrate
  ```

## 🔄 Переключение обратно на production

В десктопном приложении:
1. Settings → Server
2. Server URL: `http://179.255.187.191:3000`
3. Save и перезапустите приложение

## ⚠️ Troubleshooting

### Backend не запускается

**Ошибка**: `Port 5001 already in use`

**Решение**: Убей процесс на этом порту:
```bash
lsof -ti:5001 | xargs kill -9
```

### Приложение не подключается

1. Проверь что backend запущен: `curl http://localhost:5001/api/health`
2. Проверь настройки в Settings
3. Проверь логи в Console.app (фильтр: "Xover")

### База данных пустая

Если локальная БД пустая - нужно создать пользователя:

```bash
cd /Users/sadoewski/projects/hostprint/backend
node -e "
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const password = bcrypt.hashSync('password', 10);
db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
  ['admin', password], 
  (err) => {
    if (err) console.error(err);
    else console.log('User created: admin / password');
    db.close();
  }
);
"
```

## 📝 Тестирование новых функций

Все твои новые изменения (терминал, document links, etc.) сейчас только в локальной версии:

1. ✅ XoverTerminal component
2. ✅ DocumentLinks component  
3. ✅ Terminal backend controller
4. ✅ Document links migration

Они будут работать в desktop приложении через локальный backend!

## 🎯 Порты

- **Backend API**: http://localhost:5001
- **Frontend dev** (если запустишь): http://localhost:5173
- **macOS app**: подключается к указанному URL в Settings

---

**Готово!** Теперь можешь тестировать все новые фичи в десктопном приложении! 🎉
