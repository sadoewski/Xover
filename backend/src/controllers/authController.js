import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError
} from '../utils/errors.js';

const SALT_ROUNDS = 10;

export const authController = {
  // Регистрация
  register: asyncHandler(async (req, res) => {
    const { username, password, name, email, avatar_url } = req.body;

    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    // Проверяем существует ли пользователь с таким username
    const userExists = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userExists.rows.length > 0) {
      throw new ConflictError('Username already exists');
    }

    // Если email указан, проверяем его уникальность
    if (email) {
      const emailExists = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (emailExists.rows.length > 0) {
        throw new ConflictError('Email already in use');
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
  }),

  // Вход
  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    // Ищем пользователя по username
    const result = await pool.query(
      'SELECT id, username, name, email, avatar_url, password_hash, created_at FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('Invalid username or password');
    }

    const user = result.rows[0];

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid username or password');
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
  }),

  // Получить текущего пользователя
  getCurrentUser: asyncHandler(async (req, res) => {
    const result = await pool.query(
      'SELECT id, username, name, email, avatar_url, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', req.userId);
    }

    res.json({ user: result.rows[0] });
  }),

  // Обновить профиль
  updateProfile: asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, name, email, avatar_url, created_at',
      [name, email, req.userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', req.userId);
    }

    res.json({ user: result.rows[0] });
  }),

  // Загрузить аватар
  uploadAvatar: asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const result = await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, name, email, avatar_url, created_at',
      [avatarUrl, req.userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', req.userId);
    }

    res.json({ user: result.rows[0] });
  }),

  // Изменить пароль
  changePassword: asyncHandler(async (req, res) => {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      throw new ValidationError('Old password and new password are required');
    }

    // Получаем текущий хеш пароля
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', req.userId);
    }

    const user = result.rows[0];

    // Проверяем старый пароль
    const isValidPassword = await bcrypt.compare(old_password, user.password_hash);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid old password');
    }

    // Хешируем новый пароль
    const newPasswordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Обновляем пароль
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.userId]
    );

    res.json({ message: 'Password changed successfully' });
  }),
};
