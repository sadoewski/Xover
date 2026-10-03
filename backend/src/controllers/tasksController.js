import pool from '../config/database.js';

export const tasksController = {
  // Получить все записи за конкретный день
  async getTasksByDate(req, res) {
    const { date } = req.params;
    const userId = req.userId;

    try {
      // Получаем задачи для этой даты:
      // 1. Обычные задачи на эту дату
      // 2. Задачи с предыдущего дня, у которых время переходит на следующий день (time_slot_end < time_slot_start)
      const tasksResult = await pool.query(
        `SELECT
          t.*,
          tg.name as group_name,
          tg.color as group_color,
          tgt.name as group_type_name,
          p.name as priority_name,
          p.color as priority_color,
          CASE
            WHEN t.date < $2 THEN TRUE
            ELSE FALSE
          END as is_continuation
        FROM tasks t
        JOIN task_groups tg ON t.group_id = tg.id
        LEFT JOIN task_group_types tgt ON t.group_type_id = tgt.id
        JOIN priorities p ON t.priority_id = p.id
        WHERE t.user_id = $1
          AND (
            t.date = $2
            OR (
              t.date = $2::date - INTERVAL '1 day'
              AND t.is_time_bound = TRUE
              AND t.time_slot_end < t.time_slot_start
            )
          )
        ORDER BY
          t.date,
          CASE WHEN t.is_time_bound THEN 0 ELSE 1 END,
          t.time_slot_start NULLS LAST,
          t.created_at`,
        [userId, date]
      );

      // Получаем события для этого дня
      const dateObj = new Date(date);
      const month = dateObj.getMonth() + 1; // getMonth() возвращает 0-11
      const day = dateObj.getDate();

      const eventsResult = await pool.query(
        `SELECT * FROM events
         WHERE user_id = $1 AND month = $2 AND day = $3
         ORDER BY created_at`,
        [userId, month, day]
      );

      res.json({
        tasks: tasksResult.rows,
        events: eventsResult.rows
      });
    } catch (error) {
      console.error('Ошибка получения записей:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Получить одну запись по ID
  async getTaskById(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const result = await pool.query(
        `SELECT
          t.*,
          tg.name as group_name,
          tg.color as group_color,
          tgt.name as group_type_name,
          p.name as priority_name,
          p.color as priority_color
        FROM tasks t
        JOIN task_groups tg ON t.group_id = tg.id
        LEFT JOIN task_group_types tgt ON t.group_type_id = tgt.id
        JOIN priorities p ON t.priority_id = p.id
        WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Запись не найдена' });
      }

      res.json({ task: result.rows[0] });
    } catch (error) {
      console.error('Ошибка получения записи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Создать новую запись
  async createTask(req, res) {
    const {
      groupId,
      groupTypeId,
      priorityId,
      title,
      description,
      date,
      timeSlotStart,
      timeSlotEnd,
      isTimeBound,
      checklist,
      taskRelations,
    } = req.body;

    const userId = req.userId;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO tasks (
          user_id, group_id, group_type_id, priority_id, title,
          description, date, time_slot_start, time_slot_end,
          is_time_bound, checklist, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
        RETURNING *`,
        [
          userId,
          groupId,
          groupTypeId || null,
          priorityId,
          title,
          description || null,
          date,
          timeSlotStart || null,
          timeSlotEnd || null,
          isTimeBound || false,
          JSON.stringify(checklist || []),
        ]
      );

      const newTask = result.rows[0];

      // Обработка связей с задачами
      if (taskRelations && Array.isArray(taskRelations) && taskRelations.length > 0) {
        const now = new Date().toISOString();

        // Добавляем связи в новую задачу
        const relationData = taskRelations.map(taskId => ({
          task_id: taskId,
          created_at: now
        }));

        await client.query(
          `UPDATE tasks SET task_relations = $1::jsonb WHERE id = $2`,
          [JSON.stringify(relationData), newTask.id]
        );

        // Добавляем обратные связи в связанные задачи
        for (const taskId of taskRelations) {
          await client.query(
            `UPDATE tasks
             SET task_relations = task_relations || $1::jsonb
             WHERE id = $2 AND user_id = $3`,
            [JSON.stringify([{task_id: newTask.id, created_at: now}]), taskId, userId]
          );
        }

        newTask.task_relations = relationData;
      }

      await client.query('COMMIT');
      res.status(201).json({ task: newTask });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ошибка создания записи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    } finally {
      client.release();
    }
  },

  // Обновить запись
  async updateTask(req, res) {
    const { id } = req.params;
    const userId = req.userId;
    const updates = req.body;

    try {
      // Проверяем что запись принадлежит пользователю
      const taskCheck = await pool.query(
        'SELECT id, status, date FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (taskCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Запись не найдена' });
      }

      const task = taskCheck.rows[0];

      // Разрешаем редактировать линки, логи и чеклист даже для завершенных задач
      const readOnlyFields = ['links', 'logs', 'checklist'];
      const isOnlyReadOnlyFieldsUpdate = Object.keys(updates).every(key => readOnlyFields.includes(key));

      // Проверяем что запись можно редактировать (кроме линков, логов и чеклиста)
      if (['completed', 'cancelled'].includes(task.status) &&
          !isOnlyReadOnlyFieldsUpdate &&
          updates.status !== 'moved') {
        return res.status(400).json({
          error: 'Нельзя редактировать запись со статусом "выполнен" или "отменен"'
        });
      }

      // Формируем SQL для обновления
      const fields = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = {
        title: 'title',
        description: 'description',
        status: 'status',
        statusReason: 'status_reason',
        timeSlotStart: 'time_slot_start',
        timeSlotEnd: 'time_slot_end',
        isTimeBound: 'is_time_bound',
        isFreeTime: 'is_free_time',
        checklist: 'checklist',
        priorityId: 'priority_id',
        linkedTasks: 'linked_tasks',
        links: 'links',
        logs: 'logs',
        date: 'date',
        movedToDate: 'moved_to_date',
        movedFromDate: 'moved_from_date',
      };

      for (const [key, dbField] of Object.entries(allowedFields)) {
        if (updates[key] !== undefined) {
          fields.push(`${dbField} = $${paramCount}`);
          if (key === 'checklist' || key === 'linkedTasks' || key === 'links' || key === 'logs') {
            values.push(JSON.stringify(updates[key]));
          } else {
            values.push(updates[key]);
          }
          paramCount++;
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'Нет данных для обновления' });
      }

      values.push(id, userId);

      const result = await pool.query(
        `UPDATE tasks SET ${fields.join(', ')}
         WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
         RETURNING *`,
        values
      );

      res.json({ task: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления записи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Удалить запись
  async deleteTask(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const result = await pool.query(
        'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Запись не найдена' });
      }

      res.json({ message: 'Запись удалена' });
    } catch (error) {
      console.error('Ошибка удаления записи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Получить логи задачи
  async getTaskLogs(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      // Проверяем что задача принадлежит пользователю
      const taskCheck = await pool.query(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (taskCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Запись не найдена' });
      }

      const result = await pool.query(
        `SELECT tl.*, u.name as user_name
         FROM task_logs tl
         JOIN users u ON tl.user_id = u.id
         WHERE tl.task_id = $1
         ORDER BY tl.created_at ASC`,
        [id]
      );

      res.json({ logs: result.rows });
    } catch (error) {
      console.error('Ошибка получения логов:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Получить задачи по массиву ID
  async getTasksByIds(req, res) {
    const { ids } = req.body;
    const userId = req.userId;

    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Не указаны ID задач' });
      }

      const result = await pool.query(
        `SELECT t.id, t.title, t.date, t.status,
                tg.name as group_name, tg.color as group_color,
                p.name as priority_name, p.color as priority_color
         FROM tasks t
         JOIN task_groups tg ON t.group_id = tg.id
         JOIN priorities p ON t.priority_id = p.id
         WHERE t.id = ANY($1) AND t.user_id = $2
         ORDER BY t.date DESC`,
        [ids, userId]
      );

      res.json({ tasks: result.rows });
    } catch (error) {
      console.error('Ошибка получения задач по ID:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Связать две задачи (двусторонняя связь)
  async linkTasks(req, res) {
    const { taskId1, taskId2 } = req.body;
    const userId = req.userId;
    const client = await pool.connect();

    try {
      if (!taskId1 || !taskId2) {
        return res.status(400).json({ error: 'Не указаны ID задач' });
      }

      if (taskId1 === taskId2) {
        return res.status(400).json({ error: 'Нельзя связать задачу саму с собой' });
      }

      await client.query('BEGIN');

      // Проверяем что обе задачи принадлежат пользователю
      const tasks = await client.query(
        'SELECT id, title, task_relations FROM tasks WHERE id = ANY($1) AND user_id = $2',
        [[taskId1, taskId2], userId]
      );

      if (tasks.rows.length !== 2) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Одна или обе задачи не найдены' });
      }

      const task1 = tasks.rows.find(t => t.id === taskId1);
      const task2 = tasks.rows.find(t => t.id === taskId2);

      const now = new Date().toISOString();

      // Добавляем связь в обе задачи (двусторонняя связь)
      await client.query(
        `UPDATE tasks
         SET task_relations = task_relations || $1::jsonb
         WHERE id = $2 AND user_id = $3`,
        [JSON.stringify([{task_id: taskId2, created_at: now}]), taskId1, userId]
      );

      await client.query(
        `UPDATE tasks
         SET task_relations = task_relations || $1::jsonb
         WHERE id = $2 AND user_id = $3`,
        [JSON.stringify([{task_id: taskId1, created_at: now}]), taskId2, userId]
      );

      // Создаем логи для обеих задач
      await client.query(
        `INSERT INTO task_logs (task_id, user_id, action, details, new_value)
         VALUES ($1, $2, 'task_linked', $3, $4)`,
        [taskId1, userId, `Связана с задачей "${task2.title}"`, taskId2.toString()]
      );

      await client.query(
        `INSERT INTO task_logs (task_id, user_id, action, details, new_value)
         VALUES ($1, $2, 'task_linked', $3, $4)`,
        [taskId2, userId, `Связана с задачей "${task1.title}"`, taskId1.toString()]
      );

      await client.query('COMMIT');
      res.json({ message: 'Задачи связаны' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ошибка связывания задач:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    } finally {
      client.release();
    }
  },

  // Удалить связь между двумя задачами
  async unlinkTasks(req, res) {
    const { taskId1, taskId2 } = req.body;
    const userId = req.userId;

    const client = await pool.connect();

    try {
      if (!taskId1 || !taskId2) {
        return res.status(400).json({ error: 'Не указаны ID задач' });
      }

      await client.query('BEGIN');

      // Получаем названия задач для логов
      const tasks = await client.query(
        'SELECT id, title FROM tasks WHERE id = ANY($1) AND user_id = $2',
        [[taskId1, taskId2], userId]
      );

      if (tasks.rows.length !== 2) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Одна или обе задачи не найдены' });
      }

      const task1 = tasks.rows.find(t => t.id === taskId1);
      const task2 = tasks.rows.find(t => t.id === taskId2);

      // Удаляем связь из обеих задач
      await client.query(
        `UPDATE tasks
         SET task_relations = (
           SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
           FROM jsonb_array_elements(task_relations) elem
           WHERE (elem->>'task_id')::int != $1
         )
         WHERE id = $2 AND user_id = $3`,
        [taskId2, taskId1, userId]
      );

      await client.query(
        `UPDATE tasks
         SET task_relations = (
           SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
           FROM jsonb_array_elements(task_relations) elem
           WHERE (elem->>'task_id')::int != $1
         )
         WHERE id = $2 AND user_id = $3`,
        [taskId1, taskId2, userId]
      );

      // Создаем логи для обеих задач
      await client.query(
        `INSERT INTO task_logs (task_id, user_id, action, details, old_value)
         VALUES ($1, $2, 'task_unlinked', $3, $4)`,
        [taskId1, userId, `Удалена связь с задачей "${task2.title}"`, taskId2.toString()]
      );

      await client.query(
        `INSERT INTO task_logs (task_id, user_id, action, details, old_value)
         VALUES ($1, $2, 'task_unlinked', $3, $4)`,
        [taskId2, userId, `Удалена связь с задачей "${task1.title}"`, taskId1.toString()]
      );

      await client.query('COMMIT');

      res.json({ message: 'Связь удалена' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ошибка удаления связи:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    } finally {
      client.release();
    }
  },
};
