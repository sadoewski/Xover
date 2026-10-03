import pool from '../config/database.js';

export const datatasksController = {
  // Инициализация таблиц (выполняется при первом запросе)
  async initTables() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS datatasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          group_id INTEGER NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
          time_slot_start TIME,
          time_slot_end TIME,
          is_time_bound BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS datatask_dates (
          id SERIAL PRIMARY KEY,
          datatask_id INTEGER NOT NULL REFERENCES datatasks(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(datatask_id, date)
        );

        CREATE INDEX IF NOT EXISTS idx_datatask_dates_datatask_id ON datatask_dates(datatask_id);
        CREATE INDEX IF NOT EXISTS idx_datatask_dates_date ON datatask_dates(date);
      `);

      // Добавляем поле datatask_id в tasks если его нет
      await pool.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS datatask_id INTEGER REFERENCES datatasks(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_tasks_datatask_id ON tasks(datatask_id);
      `);
    } catch (error) {
      console.error('Error initializing datatasks tables:', error);
    }
  },

  // Получить все datatasks пользователя
  async getAllDatatasks(req, res) {
    const userId = req.userId;

    try {
      await datatasksController.initTables();

      const result = await pool.query(
        `SELECT 
          d.*,
          tg.name as group_name,
          tg.color as group_color,
          COUNT(dd.id) as dates_count
        FROM datatasks d
        JOIN task_groups tg ON d.group_id = tg.id
        LEFT JOIN datatask_dates dd ON d.id = dd.datatask_id
        WHERE d.user_id = $1
        GROUP BY d.id, tg.name, tg.color
        ORDER BY d.created_at DESC`,
        [userId]
      );

      res.json({ datatasks: result.rows });
    } catch (error) {
      console.error('Error getting datatasks:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Получить datatask по ID с датами
  async getDatataskById(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      await datatasksController.initTables();

      const datataskResult = await pool.query(
        `SELECT 
          d.*,
          tg.name as group_name,
          tg.color as group_color
        FROM datatasks d
        JOIN task_groups tg ON d.group_id = tg.id
        WHERE d.id = $1 AND d.user_id = $2`,
        [id, userId]
      );

      if (datataskResult.rows.length === 0) {
        return res.status(404).json({ error: 'DataTask не найден' });
      }

      const datesResult = await pool.query(
        `SELECT * FROM datatask_dates
         WHERE datatask_id = $1
         ORDER BY date`,
        [id]
      );

      const datatask = {
        ...datataskResult.rows[0],
        dates: datesResult.rows
      };

      res.json({ datatask });
    } catch (error) {
      console.error('Error getting datatask:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Создать новый datatask и задачи
  async createDatatask(req, res) {
    const { name, groupId, timeSlotStart, timeSlotEnd, isTimeBound, dates } = req.body;
    const userId = req.userId;

    if (!name || !groupId || !dates || dates.length === 0) {
      return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await datatasksController.initTables();

      // Создаем datatask
      const datataskResult = await client.query(
        `INSERT INTO datatasks (user_id, name, group_id, time_slot_start, time_slot_end, is_time_bound)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, name, groupId, timeSlotStart, timeSlotEnd, isTimeBound || false]
      );

      const datatask = datataskResult.rows[0];

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
            `INSERT INTO datatask_dates (datatask_id, date, status)
             VALUES ($1, $2, $3)
             ON CONFLICT (datatask_id, date) DO NOTHING`,
            [datatask.id, dateStr, 'pending']
          );
          processedDates.add(dateStr);
        }

        // Создаем задачу для этой даты
        const taskResult = await client.query(
          `INSERT INTO tasks (
            user_id, group_id, priority_id, title, date,
            time_slot_start, time_slot_end, is_time_bound,
            datatask_id, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [userId, groupId, priorityId, name, dateStr,
           timeSlotStart, timeSlotEnd, isTimeBound || false,
           datatask.id, 'pending']
        );

        createdTasks.push(taskResult.rows[0]);
      }

      await client.query('COMMIT');
      res.status(201).json({ datatask, tasks: createdTasks });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating datatask:', error);
      res.status(500).json({ error: 'Ошибка создания datatask' });
    } finally {
      client.release();
    }
  },

  // Обновить datatask
  async updateDatatask(req, res) {
    const { id } = req.params;
    const { name, groupId, timeSlotStart, timeSlotEnd, isTimeBound } = req.body;
    const userId = req.userId;

    try {
      await datatasksController.initTables();

      const result = await pool.query(
        `UPDATE datatasks
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
        return res.status(404).json({ error: 'DataTask не найден' });
      }

      res.json({ datatask: result.rows[0] });
    } catch (error) {
      console.error('Error updating datatask:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Удалить datatask и все связанные задачи
  async deleteDatatask(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await datatasksController.initTables();

      // Проверяем существование datatask
      const checkResult = await client.query(
        `SELECT id FROM datatasks WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'DataTask не найден' });
      }

      // Удаляем все задачи, связанные с datatask
      const tasksResult = await client.query(
        `DELETE FROM tasks WHERE datatask_id = $1 RETURNING id`,
        [id]
      );

      // Удаляем даты datatask (каскадно удалится при удалении datatask)
      // Удаляем сам datatask
      await client.query(
        `DELETE FROM datatasks WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');
      res.json({
        message: 'DataTask и связанные задачи удалены',
        deleted_tasks_count: tasksResult.rows.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting datatask:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    } finally {
      client.release();
    }
  },

  // Добавить дату в datatask и создать задачу
  async addDate(req, res) {
    const { id } = req.params;
    const { date } = req.body;
    const userId = req.userId;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await datatasksController.initTables();

      // Получаем datatask
      const datataskResult = await client.query(
        `SELECT * FROM datatasks WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (datataskResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'DataTask не найден' });
      }

      const datatask = datataskResult.rows[0];

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
        `INSERT INTO datatask_dates (datatask_id, date, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (datatask_id, date) DO NOTHING`,
        [id, date, 'pending']
      );

      // Создаем задачу
      const taskResult = await client.query(
        `INSERT INTO tasks (
          user_id, group_id, priority_id, title, date,
          time_slot_start, time_slot_end, is_time_bound,
          datatask_id, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [userId, datatask.group_id, priorityId, datatask.name, date,
         datatask.time_slot_start, datatask.time_slot_end, datatask.is_time_bound,
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

  // Удалить дату из datatask и связанную задачу
  async removeDate(req, res) {
    const { id, date } = req.params;
    const userId = req.userId;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await datatasksController.initTables();

      // Проверяем существование datatask
      const checkResult = await client.query(
        `SELECT id FROM datatasks WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'DataTask не найден' });
      }

      // Удаляем задачу для этой даты
      await client.query(
        `DELETE FROM tasks WHERE datatask_id = $1 AND date = $2`,
        [id, date]
      );

      // Удаляем дату
      await client.query(
        `DELETE FROM datatask_dates WHERE datatask_id = $1 AND date = $2`,
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
      await datatasksController.initTables();

      // Проверяем существование datatask
      const checkResult = await pool.query(
        `SELECT id FROM datatasks WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'DataTask не найден' });
      }

      // Обновляем статус даты
      const result = await pool.query(
        `UPDATE datatask_dates
         SET status = $1
         WHERE datatask_id = $2 AND date = $3
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
