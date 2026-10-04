import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import { NotFoundError, ValidationError, DatabaseError } from '../utils/errors.js';

// Получить все сайты пользователя
export const getSites = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const result = await pool.query(
    `SELECT id, name, icon, created_at, updated_at
     FROM sites
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  res.json({ sites: result.rows });
});

// Получить сайт с содержимым
export const getSite = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  // Проверяем права доступа
  const siteResult = await pool.query(
    'SELECT * FROM sites WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (siteResult.rows.length === 0) {
    throw new NotFoundError('Site', id);
  }

  // Получаем все элементы сайта
  const itemsResult = await pool.query(
    `SELECT * FROM site_items
     WHERE site_id = $1
     ORDER BY position_y, position_x`,
    [id]
  );

  res.json({
    site: siteResult.rows[0],
    items: itemsResult.rows
  });
});

// Создать сайт
export const createSite = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, icon } = req.body;

  if (!name) {
    throw new ValidationError('Name is required');
  }

  const result = await pool.query(
    `INSERT INTO sites (user_id, name, icon)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, name, icon || 'folder']
  );

  res.status(201).json({ site: result.rows[0] });
});

// Обновить сайт
export const updateSite = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { name, icon } = req.body;

  const result = await pool.query(
    `UPDATE sites
     SET name = COALESCE($1, name),
         icon = COALESCE($2, icon)
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [name, icon, id, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Site', id);
  }

  res.json({ site: result.rows[0] });
});

// Удалить сайт
export const deleteSite = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const result = await pool.query(
    'DELETE FROM sites WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Site', id);
  }

  res.json({ message: 'Site deleted successfully' });
});

// Создать элемент в сайте
export const createItem = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { type, name, parent_id, position_x, position_y, width, height, data } = req.body;

  // Проверяем права доступа к сайту
  const siteCheck = await pool.query(
    'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (siteCheck.rows.length === 0) {
    throw new NotFoundError('Site', id);
  }

  if (!type || !name) {
    throw new ValidationError('Type and name are required');
  }

  const result = await pool.query(
    `INSERT INTO site_items (site_id, parent_id, type, name, position_x, position_y, width, height, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [id, parent_id || null, type, name, position_x || 0, position_y || 0, width || 1, height || 1, JSON.stringify(data || {})]
  );

  res.status(201).json({ item: result.rows[0] });
});

// Обновить элемент
export const updateItem = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id, itemId } = req.params;
  const { name, position_x, position_y, width, height, data } = req.body;

  // Проверяем права доступа
  const siteCheck = await pool.query(
    `SELECT s.id FROM sites s
     JOIN site_items si ON si.site_id = s.id
     WHERE s.id = $1 AND s.user_id = $2 AND si.id = $3`,
    [id, userId, itemId]
  );

  if (siteCheck.rows.length === 0) {
    throw new NotFoundError('Site item', itemId);
  }

  const result = await pool.query(
    `UPDATE site_items
     SET name = COALESCE($1, name),
         position_x = COALESCE($2, position_x),
         position_y = COALESCE($3, position_y),
         width = COALESCE($4, width),
         height = COALESCE($5, height),
         data = COALESCE($6, data)
     WHERE id = $7
     RETURNING *`,
    [name, position_x, position_y, width, height, data ? JSON.stringify(data) : null, itemId]
  );

  res.json({ item: result.rows[0] });
});

// Удалить элемент
export const deleteItem = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id, itemId } = req.params;

  // Проверяем права доступа
  const siteCheck = await pool.query(
    `SELECT s.id FROM sites s
     JOIN site_items si ON si.site_id = s.id
     WHERE s.id = $1 AND s.user_id = $2 AND si.id = $3`,
    [id, userId, itemId]
  );

  if (siteCheck.rows.length === 0) {
    throw new NotFoundError('Site item', itemId);
  }

  await pool.query('DELETE FROM site_items WHERE id = $1', [itemId]);

  res.json({ message: 'Item deleted successfully' });
});

// Поиск по содержимому сайта
export const searchSite = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { query } = req.query;

  if (!query) {
    throw new ValidationError('Search query is required');
  }

  // Проверяем права доступа
  const siteCheck = await pool.query(
    'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (siteCheck.rows.length === 0) {
    throw new NotFoundError('Site', id);
  }

  const result = await pool.query(
    `SELECT * FROM site_items
     WHERE site_id = $1
     AND (
       name ILIKE $2
       OR data::text ILIKE $2
     )
     ORDER BY created_at DESC`,
    [id, `%${query}%`]
  );

  res.json({ results: result.rows });
});
