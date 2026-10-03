-- Добавление username и avatar, изменение email на необязательный
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Делаем email необязательным
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Создаем уникальный индекс для username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Обновляем существующего пользователя ftibbed@gmail.com
UPDATE users
SET username = 'admin'
WHERE email = 'ftibbed@gmail.com' AND username IS NULL;

-- Для остальных пользователей создаем username из email (временно)
UPDATE users
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL AND email IS NOT NULL;

-- Теперь делаем username обязательным
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
