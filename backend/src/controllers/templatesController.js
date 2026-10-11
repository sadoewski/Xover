import pool from '../config/database.js';

export const templatesController = {
  // Получить все шаблоны пользователя
  getTemplates: async (req, res) => {
    try {
      const userId = req.userId;

      const result = await pool.query(
        `SELECT id, name, description, default_priority_id, default_group_id,
                default_group_type_id, checklist_items, created_at, updated_at
         FROM task_templates
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );

      res.json({ templates: result.rows || [] });
    } catch (error) {
      console.error('Ошибка получения шаблонов:', error);
      res.status(500).json({ error: 'Ошибка получения шаблонов' });
    }
  },

  // Получить один шаблон
  getTemplateById: async (req, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, name, description, default_priority_id, default_group_id,
                default_group_type_id, checklist_items, created_at, updated_at
         FROM task_templates
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Шаблон не найден' });
      }

      res.json({ template: result.rows[0] });
    } catch (error) {
      console.error('Ошибка получения шаблона:', error);
      res.status(500).json({ error: 'Ошибка получения шаблона' });
    }
  },

  // Создать шаблон
  createTemplate: async (req, res) => {
    try {
      const userId = req.userId;
      const { name, description, defaultPriorityId, defaultGroupId, defaultGroupTypeId, checklistItems } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Название обязательно' });
      }

      const checklistJson = JSON.stringify(checklistItems || []);

      const result = await pool.query(
        `INSERT INTO task_templates (user_id, name, description, default_priority_id, default_group_id, default_group_type_id, checklist_items)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING id, name, description, default_priority_id, default_group_id, default_group_type_id, checklist_items, created_at, updated_at`,
        [userId, name, description || null, defaultPriorityId || null, defaultGroupId || null, defaultGroupTypeId || null, checklistJson]
      );

      res.status(201).json({ template: result.rows[0] });
    } catch (error) {
      console.error('Ошибка создания шаблона:', error);
      res.status(500).json({ error: 'Ошибка создания шаблона' });
    }
  },

  // Обновить шаблон
  updateTemplate: async (req, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const { name, description, defaultPriorityId, defaultGroupId, defaultGroupTypeId, checklistItems } = req.body;

      const checklistJson = checklistItems ? JSON.stringify(checklistItems) : undefined;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }
      if (defaultPriorityId !== undefined) {
        updates.push(`default_priority_id = $${paramCount}`);
        values.push(defaultPriorityId);
        paramCount++;
      }
      if (defaultGroupId !== undefined) {
        updates.push(`default_group_id = $${paramCount}`);
        values.push(defaultGroupId);
        paramCount++;
      }
      if (defaultGroupTypeId !== undefined) {
        updates.push(`default_group_type_id = $${paramCount}`);
        values.push(defaultGroupTypeId);
        paramCount++;
      }
      if (checklistJson !== undefined) {
        updates.push(`checklist_items = $${paramCount}`);
        values.push(checklistJson);
        paramCount++;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      values.push(userId);

      const result = await pool.query(
        `UPDATE task_templates
         SET ${updates.join(', ')}
         WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
         RETURNING id, name, description, default_priority_id, default_group_id, default_group_type_id, checklist_items, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Шаблон не найден' });
      }

      res.json({ template: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления шаблона:', error);
      res.status(500).json({ error: 'Ошибка обновления шаблона' });
    }
  },

  // Удалить шаблон
  deleteTemplate: async (req, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const result = await pool.query(
        `DELETE FROM task_templates
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Шаблон не найден' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Ошибка удаления шаблона:', error);
      res.status(500).json({ error: 'Ошибка удаления шаблона' });
    }
  }
};
