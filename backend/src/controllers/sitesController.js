import pool from '../config/database.js';

// Получить все сайты пользователя
export const getSites = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT id, name, icon, created_at, updated_at
       FROM sites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ sites: result.rows });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
};

// Получить сайт с содержимым
export const getSite = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Проверяем права доступа
    const siteResult = await pool.query(
      'SELECT * FROM sites WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
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
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ error: 'Failed to fetch site' });
  }
};

// Создать сайт
export const createSite = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      `INSERT INTO sites (user_id, name, icon)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name, icon || 'folder']
    );

    res.status(201).json({ site: result.rows[0] });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
};

// Обновить сайт
export const updateSite = async (req, res) => {
  try {
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
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ site: result.rows[0] });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
};

// Удалить сайт
export const deleteSite = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sites WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
};

// Создать элемент в сайте
export const createItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { type, name, parent_id, position_x, position_y, width, height, data } = req.body;

    // Проверяем права доступа к сайту
    const siteCheck = await pool.query(
      'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (siteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required' });
    }

    const result = await pool.query(
      `INSERT INTO site_items (site_id, parent_id, type, name, position_x, position_y, width, height, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, parent_id || null, type, name, position_x || 0, position_y || 0, width || 1, height || 1, JSON.stringify(data || {})]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

// Обновить элемент
export const updateItem = async (req, res) => {
  try {
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
      return res.status(404).json({ error: 'Item not found' });
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
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

// Удалить элемент
export const deleteItem = async (req, res) => {
  try {
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
      return res.status(404).json({ error: 'Item not found' });
    }

    await pool.query('DELETE FROM site_items WHERE id = $1', [itemId]);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

// Поиск по содержимому сайта
export const searchSite = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Проверяем права доступа
    const siteCheck = await pool.query(
      'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (siteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
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
  } catch (error) {
    console.error('Error searching site:', error);
    res.status(500).json({ error: 'Failed to search site' });
  }
};
