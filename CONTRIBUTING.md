# Contributing to HostPrint

Спасибо за интерес к проекту! 🎉

## Начало работы

### 1. Fork и Clone

```bash
git clone https://github.com/YOUR_USERNAME/hostprint.git
cd hostprint
```

### 2. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Настройка окружения

```bash
# Backend
cp backend/.env.example backend/.env
# Отредактируйте .env

# Database
cd backend
npm run db:migrate
```

### 4. Запуск

```bash
# Backend (порт 5001)
cd backend
npm run dev

# Frontend (порт 3000)
cd frontend
npm start
```

## Процесс разработки

### Создание ветки

```bash
git checkout -b feature/your-feature-name
# или
git checkout -b fix/bug-description
```

**Именование веток:**
- `feature/` — новая функциональность
- `fix/` — исправление бага
- `docs/` — обновление документации
- `refactor/` — рефакторинг
- `test/` — добавление тестов

### Коммиты

Используем Conventional Commits:

```bash
git commit -m "feat(backend): add user authentication"
git commit -m "fix(frontend): resolve login button styling"
git commit -m "docs: update API documentation"
git commit -m "test(backend): add auth controller tests"
```

**Типы коммитов:**
- `feat` — новая функциональность
- `fix` — исправление бага
- `docs` — документация
- `style` — форматирование, отступы
- `refactor` — рефакторинг кода
- `test` — добавление тестов
- `chore` — обновление зависимостей, конфигов

### Тестирование

Перед PR убедитесь что тесты проходят:

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run build  # Проверка сборки
```

### Pull Request

1. Push ветки:
```bash
git push origin feature/your-feature-name
```

2. Создайте PR на GitHub
3. Заполните PR template
4. Дождитесь review
5. Исправьте замечания если есть

## Code Style

### Backend (Node.js)

- ES6 modules (`import`/`export`)
- async/await вместо callbacks
- JSDoc комментарии для функций
- Обработка ошибок через try/catch
- Валидация входных данных

```javascript
/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User object
 * @throws {NotFoundError} If user not found
 */
async function getUserById(userId) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}
```

### Frontend (React)

- Functional components с hooks
- PropTypes для type checking
- CSS Modules для стилей
- Именование: `ComponentName.jsx`, `ComponentName.module.css`

```javascript
import PropTypes from 'prop-types';
import styles from './Button.module.css';

function Button({ label, onClick, disabled }) {
  return (
    <button 
      className={styles.button} 
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  disabled: false,
};
```

## Структура проекта

```
hostprint/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Бизнес-логика
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Middleware functions
│   │   ├── utils/          # Утилиты
│   │   └── config/         # Конфигурация
│   ├── tests/              # Тесты
│   └── migrations/         # DB миграции
├── frontend/
│   └── src/
│       ├── components/     # React компоненты
│       ├── services/       # API клиенты
│       ├── hooks/          # Custom hooks
│       └── utils/          # Утилиты
└── docs/                   # Документация
```

## Приоритеты (P1, P2, P3)

- **P1** — Критично, блокирует релиз
- **P2** — Важно, желательно в релизе
- **P3** — Хорошо иметь, можно отложить

## Вопросы?

- Создайте [Discussion](https://github.com/sadoewski/hostprint/discussions)
- Или [Issue](https://github.com/sadoewski/hostprint/issues/new/choose)

## License

MIT — см. [LICENSE](LICENSE)
