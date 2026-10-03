import pool from '../config/database.js';

const eventsController = {
  // Получить все события пользователя
  getEvents: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const result = await pool.query(
        `SELECT id, type, name, description, date, month, day, is_day_off, is_yearly, created_at, updated_at
         FROM events
         WHERE user_id = $1
         ORDER BY month, day`,
        [userId]
      );

      res.json({ events: result.rows });
    } catch (error) {
      console.error('Ошибка получения событий:', error);
      res.status(500).json({ error: 'Ошибка получения событий' });
    }
  },

  // Получить события за конкретный месяц
  getEventsByMonth: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { month } = req.params;

      const result = await pool.query(
        `SELECT id, type, name, description, date, month, day, is_day_off, is_yearly, created_at, updated_at
         FROM events
         WHERE user_id = $1 AND month = $2
         ORDER BY day`,
        [userId, parseInt(month)]
      );

      res.json({ events: result.rows });
    } catch (error) {
      console.error('Ошибка получения событий за месяц:', error);
      res.status(500).json({ error: 'Ошибка получения событий' });
    }
  },

  // Получить события за конкретный день
  getEventsByDate: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { month, day } = req.params;

      const result = await pool.query(
        `SELECT id, type, name, description, date, month, day, is_day_off, is_yearly, created_at, updated_at
         FROM events
         WHERE user_id = $1 AND month = $2 AND day = $3
         ORDER BY name`,
        [userId, parseInt(month), parseInt(day)]
      );

      res.json({ events: result.rows });
    } catch (error) {
      console.error('Ошибка получения событий за день:', error);
      res.status(500).json({ error: 'Ошибка получения событий' });
    }
  },

  // Получить одно событие
  getEventById: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, type, name, description, date, month, day, is_day_off, is_yearly, created_at, updated_at
         FROM events
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }

      res.json({ event: result.rows[0] });
    } catch (error) {
      console.error('Ошибка получения события:', error);
      res.status(500).json({ error: 'Ошибка получения события' });
    }
  },

  // Создать событие
  createEvent: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { type, name, description, month, day, date, isDayOff, isYearly } = req.body;

      // Для ежегодных событий используем month и day
      // Для разовых событий используем date
      let eventMonth, eventDay, eventDate;

      if (isYearly === false && date) {
        // Разовое событие - используем полную дату
        eventDate = date;
        const parsedDate = new Date(date);
        eventMonth = parsedDate.getMonth() + 1;
        eventDay = parsedDate.getDate();
      } else {
        // Ежегодное событие - используем только месяц и день
        eventMonth = month;
        eventDay = day;
        // Для date используем текущий год
        const currentYear = new Date().getFullYear();
        eventDate = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      const result = await pool.query(
        `INSERT INTO events (user_id, type, name, description, date, month, day, is_day_off, is_yearly)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, type, name, description, date, month, day, is_day_off, is_yearly, created_at, updated_at`,
        [userId, type, name, description || null, eventDate, eventMonth, eventDay, isDayOff || false, isYearly !== false]
      );

      res.status(201).json({ event: result.rows[0] });
    } catch (error) {
      console.error('Ошибка создания события:', error);
      res.status(500).json({ error: 'Ошибка создания события', details: error.message });
    }
  },

  // Обновить событие
  updateEvent: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { id } = req.params;
      const { type, name, description, month, day, date, isDayOff, isYearly } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (type !== undefined) {
        updates.push(`type = $${paramCount++}`);
        values.push(type);
      }
      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }

      // Обработка даты в зависимости от типа события
      if (isYearly === false && date) {
        const parsedDate = new Date(date);
        updates.push(`date = $${paramCount++}`);
        values.push(date);
        updates.push(`month = $${paramCount++}`);
        values.push(parsedDate.getMonth() + 1);
        updates.push(`day = $${paramCount++}`);
        values.push(parsedDate.getDate());
      } else if (month !== undefined && day !== undefined) {
        updates.push(`month = $${paramCount++}`);
        values.push(month);
        updates.push(`day = $${paramCount++}`);
        values.push(day);
        const currentYear = new Date().getFullYear();
        updates.push(`date = $${paramCount++}`);
        values.push(`${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }

      if (isDayOff !== undefined) {
        updates.push(`is_day_off = $${paramCount++}`);
        values.push(isDayOff);
      }
      if (isYearly !== undefined) {
        updates.push(`is_yearly = $${paramCount++}`);
        values.push(isYearly);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Нет данных для обновления' });
      }

      values.push(id, userId);

      const result = await pool.query(
        `UPDATE events
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount++} AND user_id = $${paramCount}
         RETURNING id, type, name, description, date, month, day, is_day_off, is_yearly, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }

      res.json({ event: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления события:', error);
      res.status(500).json({ error: 'Ошибка обновления события' });
    }
  },

  // Удалить событие
  deleteEvent: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }

      res.json({ message: 'Событие удалено' });
    } catch (error) {
      console.error('Ошибка удаления события:', error);
      res.status(500).json({ error: 'Ошибка удаления события' });
    }
  },

  // Получить заметки для события за год
  getEventYearNotes: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { eventId } = req.params;

      const result = await pool.query(
        `SELECT id, event_id, year, note, created_at, updated_at
         FROM event_year_notes
         WHERE event_id = $1 AND user_id = $2
         ORDER BY year DESC`,
        [eventId, userId]
      );

      res.json({ notes: result.rows });
    } catch (error) {
      console.error('Ошибка получения заметок:', error);
      res.status(500).json({ error: 'Ошибка получения заметок' });
    }
  },

  // Создать или обновить заметку для события за год
  upsertEventYearNote: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { eventId } = req.params;
      const { year, note } = req.body;

      const result = await pool.query(
        `INSERT INTO event_year_notes (event_id, user_id, year, note)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id, year)
         DO UPDATE SET note = $4, updated_at = CURRENT_TIMESTAMP
         RETURNING id, event_id, year, note, created_at, updated_at`,
        [eventId, userId, year, note]
      );

      res.json({ note: result.rows[0] });
    } catch (error) {
      console.error('Ошибка сохранения заметки:', error);
      res.status(500).json({ error: 'Ошибка сохранения заметки' });
    }
  },

  // Удалить заметку для события за год
  deleteEventYearNote: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { eventId, noteId } = req.params;

      const result = await pool.query(
        `DELETE FROM event_year_notes
         WHERE id = $1 AND event_id = $2 AND user_id = $3
         RETURNING id`,
        [noteId, eventId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Заметка не найдена' });
      }

      res.json({ message: 'Заметка удалена' });
    } catch (error) {
      console.error('Ошибка удаления заметки:', error);
      res.status(500).json({ error: 'Ошибка удаления заметки' });
    }
  },
};

export default eventsController;
