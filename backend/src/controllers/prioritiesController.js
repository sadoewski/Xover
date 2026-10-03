import pool from '../config/database.js';

export const prioritiesController = {
  // Получить все приоритеты пользователя
  async getPriorities(req, res) {
    const userId = req.userId;

    try {
      const result = await pool.query(
        'SELECT * FROM priorities WHERE user_id = $1 ORDER BY level, created_at',
        [userId]
      );

      res.json({ priorities: result.rows });
    } catch (error) {
      console.error('Ошибка получения приоритетов:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Создать приоритет
  async createPriority(req, res) {
    const { name, color, description, level } = req.body;
    const userId = req.userId;

    try {
      const result = await pool.query(
        'INSERT INTO priorities (user_id, name, color, description, level) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, name, color, description || null, level || 1]
      );

      res.status(201).json({ priority: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Приоритет с таким названием уже существует' });
      }
      console.error('Ошибка создания приоритета:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Получить приоритет по ID
  async getPriorityById(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const result = await pool.query(
        'SELECT * FROM priorities WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Приоритет не найден' });
      }

      res.json({ priority: result.rows[0] });
    } catch (error) {
      console.error('Ошибка получения приоритета:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Обновить приоритет
  async updatePriority(req, res) {
    const { id } = req.params;
    const { name, color, description, level } = req.body;
    const userId = req.userId;

    try {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (color !== undefined) {
        updates.push(`color = $${paramCount++}`);
        values.push(color);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (level !== undefined) {
        updates.push(`level = $${paramCount++}`);
        values.push(level);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Нет данных для обновления' });
      }

      values.push(id, userId);
      const result = await pool.query(
        `UPDATE priorities SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Приоритет не найден' });
      }

      res.json({ priority: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления приоритета:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Удалить приоритет
  async deletePriority(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const priorityCheck = await pool.query(
        'SELECT id FROM priorities WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (priorityCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Приоритет не найден' });
      }

      await pool.query('DELETE FROM priorities WHERE id = $1', [id]);

      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка удаления приоритета:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },
};
