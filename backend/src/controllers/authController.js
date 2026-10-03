import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const SALT_ROUNDS = 10;

export const authController = {
  // Регистрация
  async register(req, res) {
    const { username, password, name, email, avatar_url } = req.body;

    try {
      // Проверяем существует ли пользователь с таким username
      const userExists = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'Пользователь с таким username уже существует' });
      }

      // Если email указан, проверяем его уникальность
      if (email) {
        const emailExists = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (emailExists.rows.length > 0) {
          return res.status(400).json({ error: 'Email уже используется' });
        }
      }

      // Хешируем пароль
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Создаем пользователя
      const result = await pool.query(
        'INSERT INTO users (username, password_hash, name, email, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, email, avatar_url, created_at',
        [username, passwordHash, name, email || null, avatar_url || null]
      );

      const user = result.rows[0];

      // Создаем JWT токен
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
        },
        token,
      });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Вход
  async login(req, res) {
    const { username, password } = req.body;

    try {
      // Ищем пользователя по username
      const result = await pool.query(
        'SELECT id, username, name, email, avatar_url, password_hash, created_at FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Неверный username или пароль' });
      }

      const user = result.rows[0];

      // Проверяем пароль
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Неверный username или пароль' });
      }

      // Создаем JWT токен
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
        },
        token,
      });
    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Получить текущего пользователя
  async getCurrentUser(req, res) {
    try {
      const result = await pool.query(
        'SELECT id, username, name, email, avatar_url, created_at FROM users WHERE id = $1',
        [req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Обновить профиль
  async updateProfile(req, res) {
    const { name, email } = req.body;

    try {
      const result = await pool.query(
        'UPDATE users SET name = COALESCE($1, name), email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, name, email, avatar_url, created_at',
        [name, email, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Загрузить аватар
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const result = await pool.query(
        'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, name, email, avatar_url, created_at',
        [avatarUrl, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Изменить пароль
  async changePassword(req, res) {
    const { old_password, new_password } = req.body;

    try {
      // Получаем текущий хеш пароля
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      const user = result.rows[0];

      // Проверяем старый пароль
      const isValidPassword = await bcrypt.compare(old_password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Неверный старый пароль' });
      }

      // Хешируем новый пароль
      const newPasswordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

      // Обновляем пароль
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, req.userId]
      );

      res.json({ message: 'Пароль успешно изменен' });
    } catch (error) {
      console.error('Ошибка изменения пароля:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },
};
