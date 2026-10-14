import pool from '../config/database.js';

export const taskbasesController = {
  // Получить все taskbases пользователя
  async getAllTaskBases(req, res) {
    const userId = req.userId;

    try {
      const result = await pool.query(
        `SELECT 
          d.*,
          tg.name as group_name,
          tg.color as group_color,
          COUNT(dd.id) as dates_count
        FROM taskbases d
        JOIN task_groups tg ON d.group_id = tg.id
        LEFT JOIN taskbase_dates dd ON d.id = dd.taskbase_id
        WHERE d.user_id = $1
        GROUP BY d.id, tg.name, tg.color
        ORDER BY d.created_at DESC`,
        [userId]
      );

      res.json({ taskbases: result.rows });
    } catch (error) {
      console.error('Error getting taskbases:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Получить taskbase по ID с датами
  async getTaskBaseById(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const taskbaseResult = await pool.query(
        `SELECT 
          d.*,
          tg.name as group_name,
          tg.color as group_color
        FROM taskbases d
        JOIN task_groups tg ON d.group_id = tg.id
        WHERE d.id = $1 AND d.user_id = $2`,
        [id, userId]
      );

      if (taskbaseResult.rows.length === 0) {
        return res.status(404).json({ error: 'TaskBase не найден' });
      }

      const datesResult = await pool.query(
        `SELECT * FROM taskbase_dates
         WHERE taskbase_id = $1
         ORDER BY date`,
        [id]
      );

      const taskbase = {
        ...taskbaseResult.rows[0],
        dates: datesResult.rows
      };

      res.json({ taskbase });
    } catch (error) {
      console.error('Error getting taskbase:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Создать новый taskbase и задачи
  async createTaskBase(req, res) {
    const { name, groupId, timeSlotStart, timeSlotEnd, isTimeBound, dates } = req.body;
    const userId = req.userId;

    if (!name || !groupId || !dates || dates.length === 0) {
      return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Создаем taskbase
      const taskbaseResult = await client.query(
        `INSERT INTO taskbases (user_id, name, group_id, time_slot_start, time_slot_end, is_time_bound)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, name, groupId, timeSlotStart, timeSlotEnd, isTimeBound || false]
      );

      const taskbase = taskbaseResult.rows[0];

      // Получаем приоритет по умолчанию для создания задач
      const priorityResult = await client.query(
        `SELECT id FROM priorities WHERE user_id = $1 ORDER BY level LIMIT 1`,
        [userId]
      );

      if (priorityResult.rows.length === 0) {
        throw new Error('У пользователя нет приоритетов');
      }

      const priorityId = priorityResult.rows[0].id;

      // Определяем, переходит ли время на следующий день
      const isOvernight = isTimeBound && timeSlotStart && timeSlotEnd && timeSlotEnd < timeSlotStart;

      // Создаем даты и задачи для каждой даты
      const createdTasks = [];
      const processedDates = new Set();

      for (const dateStr of dates) {
        // Добавляем основную дату
        if (!processedDates.has(dateStr)) {
          await client.query(
            `INSERT INTO taskbase_dates (taskbase_id, date, status)
             VALUES ($1, $2, $3)
             ON CONFLICT (taskbase_id, date) DO NOTHING`,
            [taskbase.id, dateStr, 'pending']
          );
          processedDates.add(dateStr);
        }

        // Создаем задачу для этой даты
        const taskResult = await client.query(
          `INSERT INTO tasks (
            user_id, group_id, priority_id, title, date,
            time_slot_start, time_slot_end, is_time_bound,
            taskbase_id, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [userId, groupId, priorityId, name, dateStr,
           timeSlotStart, timeSlotEnd, isTimeBound || false,
           taskbase.id, 'pending']
        );

        createdTasks.push(taskResult.rows[0]);
      }

      await client.query('COMMIT');
      res.status(201).json({ taskbase, tasks: createdTasks });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating taskbase:', error);
      res.status(500).json({ error: 'Ошибка создания taskbase' });
    } finally {
      client.release();
    }
  },

  // Обновить taskbase
  async updateTaskBase(req, res) {
    const { id } = req.params;
    const { name, groupId, timeSlotStart, timeSlotEnd, isTimeBound } = req.body;
    const userId = req.userId;

    try {
      const result = await pool.query(
        `UPDATE taskbases
         SET name = COALESCE($1, name),
             group_id = COALESCE($2, group_id),
             time_slot_start = COALESCE($3, time_slot_start),
             time_slot_end = COALESCE($4, time_slot_end),
             is_time_bound = COALESCE($5, is_time_bound),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [name, groupId, timeSlotStart, timeSlotEnd, isTimeBound, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'TaskBase не найден' });
      }

      res.json({ taskbase: result.rows[0] });
    } catch (error) {
      console.error('Error updating taskbase:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Удалить taskbase и все связанные задачи
  async deleteTaskBase(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Проверяем существование taskbase
      const checkResult = await client.query(
        `SELECT id FROM taskbases WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'TaskBase не найден' });
      }

      // Удаляем все задачи, связанные с taskbase
      const tasksResult = await client.query(
        `DELETE FROM tasks WHERE taskbase_id = $1 RETURNING id`,
        [id]
      );

      // Удаляем даты taskbase (каскадно удалится при удалении taskbase)
      // Удаляем сам taskbase
      await client.query(
        `DELETE FROM taskbases WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');
      res.json({
        message: 'TaskBase и связанные задачи удалены',
        deleted_tasks_count: tasksResult.rows.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting taskbase:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    } finally {
      client.release();
    }
  },

  // Добавить дату в taskbase и создать задачу
  async addDate(req, res) {
    const { id } = req.params;
    const { date } = req.body;
    const userId = req.userId;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Получаем taskbase
      const taskbaseResult = await client.query(
        `SELECT * FROM taskbases WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (taskbaseResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'TaskBase не найден' });
      }

      const taskbase = taskbaseResult.rows[0];

      // Получаем приоритет по умолчанию
      const priorityResult = await client.query(
        `SELECT id FROM priorities WHERE user_id = $1 ORDER BY level LIMIT 1`,
        [userId]
      );

      if (priorityResult.rows.length === 0) {
        throw new Error('У пользователя нет приоритетов');
      }

      const priorityId = priorityResult.rows[0].id;

      // Добавляем дату
      await client.query(
        `INSERT INTO taskbase_dates (taskbase_id, date, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (taskbase_id, date) DO NOTHING`,
        [id, date, 'pending']
      );

      // Создаем задачу
      const taskResult = await client.query(
        `INSERT INTO tasks (
          user_id, group_id, priority_id, title, date,
          time_slot_start, time_slot_end, is_time_bound,
          taskbase_id, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [userId, taskbase.group_id, priorityId, taskbase.name, date,
         taskbase.time_slot_start, taskbase.time_slot_end, taskbase.is_time_bound,
         id, 'pending']
      );

      await client.query('COMMIT');
      res.json({ task: taskResult.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding date:', error);
      res.status(500).json({ error: 'Ошибка добавления даты' });
    } finally {
      client.release();
    }
  },

  // Удалить дату из taskbase и связанную задачу
  async removeDate(req, res) {
    const { id, date } = req.params;
    const userId = req.userId;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Проверяем существование taskbase
      const checkResult = await client.query(
        `SELECT id FROM taskbases WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'TaskBase не найден' });
      }

      // Удаляем задачу для этой даты
      await client.query(
        `DELETE FROM tasks WHERE taskbase_id = $1 AND date = $2`,
        [id, date]
      );

      // Удаляем дату
      await client.query(
        `DELETE FROM taskbase_dates WHERE taskbase_id = $1 AND date = $2`,
        [id, date]
      );

      await client.query('COMMIT');
      res.json({ message: 'Дата и задача удалены' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error removing date:', error);
      res.status(500).json({ error: 'Ошибка удаления даты' });
    } finally {
      client.release();
    }
  },

  // Обновить статус даты
  async updateDateStatus(req, res) {
    const { id, date } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    try {
      // Проверяем существование taskbase
      const checkResult = await pool.query(
        `SELECT id FROM taskbases WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'TaskBase не найден' });
      }

      // Обновляем статус даты
      const result = await pool.query(
        `UPDATE taskbase_dates
         SET status = $1
         WHERE taskbase_id = $2 AND date = $3
         RETURNING *`,
        [status, id, date]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Дата не найдена' });
      }

      res.json({ date: result.rows[0] });
    } catch (error) {
      console.error('Error updating date status:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
};
