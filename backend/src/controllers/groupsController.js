import pool from '../config/database.js';

export const groupsController = {
  // Получить все группы пользователя
  async getGroups(req, res) {
    const userId = req.userId;

    try {
      const result = await pool.query(
        `SELECT
          tg.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', tgt.id,
                'name', tgt.name,
                'description', tgt.description,
                'created_at', tgt.created_at
              )
              ORDER BY tgt.created_at
            ) FILTER (WHERE tgt.id IS NOT NULL),
            '[]'
          ) as types
        FROM task_groups tg
        LEFT JOIN task_group_types tgt ON tg.id = tgt.group_id
        WHERE tg.user_id = $1
        GROUP BY tg.id
        ORDER BY tg.created_at`,
        [userId]
      );

      res.json({ groups: result.rows });
    } catch (error) {
      console.error('Ошибка получения групп:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Создать группу
  async createGroup(req, res) {
    const { name, color, description } = req.body;
    const userId = req.userId;

    try {
      const result = await pool.query(
        'INSERT INTO task_groups (user_id, name, color, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, name, color, description || null]
      );

      res.status(201).json({ group: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Группа с таким названием уже существует' });
      }
      console.error('Ошибка создания группы:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Создать вид группы
  async createGroupType(req, res) {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const userId = req.userId;

    try {
      // Проверяем что группа принадлежит пользователю
      const groupCheck = await pool.query(
        'SELECT id FROM task_groups WHERE id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (groupCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Группа не найдена' });
      }

      const result = await pool.query(
        'INSERT INTO task_group_types (group_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [groupId, name, description || null]
      );

      res.status(201).json({ groupType: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Вид с таким названием уже существует в этой группе' });
      }
      console.error('Ошибка создания вида группы:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Получить группу по ID
  async getGroupById(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const result = await pool.query(
        `SELECT
          tg.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', tgt.id,
                'name', tgt.name,
                'description', tgt.description,
                'created_at', tgt.created_at
              )
              ORDER BY tgt.created_at
            ) FILTER (WHERE tgt.id IS NOT NULL),
            '[]'
          ) as types
        FROM task_groups tg
        LEFT JOIN task_group_types tgt ON tg.id = tgt.group_id
        WHERE tg.id = $1 AND tg.user_id = $2
        GROUP BY tg.id`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Группа не найдена' });
      }

      res.json({ group: result.rows[0] });
    } catch (error) {
      console.error('Ошибка получения группы:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Обновить группу
  async updateGroup(req, res) {
    const { id } = req.params;
    const { name, color, description } = req.body;
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

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Нет данных для обновления' });
      }

      values.push(id, userId);
      const result = await pool.query(
        `UPDATE task_groups SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Группа не найдена' });
      }

      res.json({ group: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления группы:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Удалить группу
  async deleteGroup(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      // Проверяем что группа принадлежит пользователю
      const groupCheck = await pool.query(
        'SELECT id FROM task_groups WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (groupCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Группа не найдена' });
      }

      // Удаляем группу (типы удалятся автоматически через CASCADE)
      await pool.query('DELETE FROM task_groups WHERE id = $1', [id]);

      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка удаления группы:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Удалить тип группы
  async deleteGroupType(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      // Проверяем что тип принадлежит группе пользователя
      const typeCheck = await pool.query(
        `SELECT tgt.id FROM task_group_types tgt
         JOIN task_groups tg ON tgt.group_id = tg.id
         WHERE tgt.id = $1 AND tg.user_id = $2`,
        [id, userId]
      );

      if (typeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Тип не найден' });
      }

      await pool.query('DELETE FROM task_group_types WHERE id = $1', [id]);

      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка удаления типа:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },
};
