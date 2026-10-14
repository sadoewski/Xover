import pool from '../config/database.js';

// Status mapping
const STATUS_MAP = {
  '-a': 'pending',
  '-p': 'in_progress',
  '-c': 'completed',
  '-d': 'cancelled',
  '-ex': 'moved'
};

const STATUS_LABELS = {
  'pending': 'awaiting',
  'in_progress': 'in progress',
  'completed': 'completed',
  'cancelled': 'cancelled',
  'moved': 'postponed'
};

// Helper to parse date DD.MM.YYYY
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1) return null;

  return date.toISOString().split('T')[0];
};

// Format date to DD.MM.YYYY
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const terminalController = {
  // Get dashboard info (admin panel)
  async getBoard(req, res) {
    const userId = req.userId;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get task statistics for today
      const stats = await pool.query(
        `SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM tasks
        WHERE user_id = $1 AND date = $2`,
        [userId, today]
      );

      res.json({ stats: stats.rows[0] });
    } catch (error) {
      console.error('Error getting board:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get tasks by date with optional status filter
  async getTasksByDate(req, res) {
    const userId = req.userId;
    const { date, status } = req.query;

    try {
      const parsedDate = parseDate(date);
      if (!parsedDate) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      let query = `
        SELECT
          t.id,
          t.title,
          t.description,
          t.date,
          t.status,
          t.time_slot_start,
          t.time_slot_end,
          t.is_time_bound,
          t.created_at,
          tg.name as group_name,
          tg.color as group_color,
          tgt.name as group_type_name,
          p.name as priority_name,
          t.links
        FROM tasks t
        JOIN task_groups tg ON t.group_id = tg.id
        LEFT JOIN task_group_types tgt ON t.group_type_id = tgt.id
        JOIN priorities p ON t.priority_id = p.id
        WHERE t.user_id = $1 AND t.date = $2
      `;

      const params = [userId, parsedDate];

      if (status) {
        query += ' AND t.status = $3';
        params.push(status);
      }

      query += ' ORDER BY t.time_slot_start NULLS LAST, t.created_at';

      const result = await pool.query(query, params);
      res.json({ tasks: result.rows });
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get tasks in date range
  async getTasksInRange(req, res) {
    const userId = req.userId;
    const { startDate, endDate, status } = req.query;

    try {
      // Support both ISO (YYYY-MM-DD) and DD.MM.YYYY formats
      const parsedStart = startDate.includes('.') ? parseDate(startDate) : startDate;
      const parsedEnd = endDate.includes('.') ? parseDate(endDate) : endDate;

      if (!parsedStart || !parsedEnd) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      let query = `
        SELECT
          t.id,
          t.title,
          t.description,
          t.date,
          t.status,
          t.group_id,
          t.group_type_id,
          t.priority_id
        FROM tasks t
        WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
      `;

      const params = [userId, parsedStart, parsedEnd];

      if (status) {
        query += ' AND t.status = $4';
        params.push(status);
      }

      query += ' ORDER BY t.date, t.time_slot_start NULLS LAST';

      const result = await pool.query(query, params);

      // Return flat array of tasks (not grouped)
      res.json({ tasks: result.rows });
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get task details by ID
  async getTaskDetails(req, res) {
    const userId = req.userId;
    const { id } = req.params;

    try {
      const result = await pool.query(
        `SELECT
          t.id,
          t.title,
          t.description,
          t.date,
          t.status,
          t.time_slot_start,
          t.time_slot_end,
          t.is_time_bound,
          t.created_at,
          t.links,
          tg.name as group_name,
          tgt.name as group_type_name,
          p.name as priority_name
        FROM tasks t
        JOIN task_groups tg ON t.group_id = tg.id
        LEFT JOIN task_group_types tgt ON t.group_type_id = tgt.id
        JOIN priorities p ON t.priority_id = p.id
        WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ task: result.rows[0] });
    } catch (error) {
      console.error('Error getting task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update task status
  async updateTaskStatus(req, res) {
    const userId = req.userId;
    const { id } = req.params;
    const { status, movedToDate } = req.body;

    try {
      // Verify task ownership
      const taskCheck = await pool.query(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (taskCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      let query = 'UPDATE tasks SET status = $1';
      const params = [status, id, userId];

      if (status === 'moved' && movedToDate) {
        const parsedDate = parseDate(movedToDate);
        if (!parsedDate) {
          return res.status(400).json({ error: 'Invalid date format' });
        }
        query += ', date = $4, moved_to_date = $4';
        params.push(parsedDate);
      }

      query += ' WHERE id = $2 AND user_id = $3 RETURNING *';

      const result = await pool.query(query, params);
      res.json({
        task: result.rows[0],
        message: `Task #${id} status updated to ${STATUS_LABELS[status]}`
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete task
  async deleteTask(req, res) {
    const userId = req.userId;
    const { id } = req.params;

    try {
      const result = await pool.query(
        'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ message: `Task #${id} deleted` });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get task links
  async getTaskLinks(req, res) {
    const userId = req.userId;
    const { id } = req.params;

    try {
      const result = await pool.query(
        'SELECT id, links FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const links = result.rows[0].links || [];
      res.json({ links });
    } catch (error) {
      console.error('Error getting links:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Add task link
  async addTaskLink(req, res) {
    const userId = req.userId;
    const { id } = req.params;
    const { link } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, links FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const links = result.rows[0].links || [];
      const newLink = {
        id: links.length + 1,
        url: link,
        created_at: new Date().toISOString()
      };

      links.push(newLink);

      await pool.query(
        'UPDATE tasks SET links = $1 WHERE id = $2 AND user_id = $3',
        [JSON.stringify(links), id, userId]
      );

      res.json({
        message: `Link added to task #${id}`,
        link: newLink
      });
    } catch (error) {
      console.error('Error adding link:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete task link
  async deleteTaskLink(req, res) {
    const userId = req.userId;
    const { id, linkId } = req.params;

    try {
      const result = await pool.query(
        'SELECT id, links FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      let links = result.rows[0].links || [];
      const linkIdNum = parseInt(linkId, 10);

      links = links.filter(l => l.id !== linkIdNum);

      await pool.query(
        'UPDATE tasks SET links = $1 WHERE id = $2 AND user_id = $3',
        [JSON.stringify(links), id, userId]
      );

      res.json({ message: `Link #${linkId} deleted from task #${id}` });
    } catch (error) {
      console.error('Error deleting link:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get taskbases
  async getTaskBases(req, res) {
    const userId = req.userId;

    try {
      const result = await pool.query(
        `SELECT dt.*,
          (SELECT COUNT(*) FROM tasks t WHERE t.group_id = ANY(dt.task_groups)) as task_count
        FROM taskbases dt
        WHERE dt.user_id = $1
        ORDER BY dt.name`,
        [userId]
      );

      res.json({ taskbases: result.rows });
    } catch (error) {
      console.error('Error getting taskbases:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get events
  async getEvents(req, res) {
    const userId = req.userId;
    const { filter } = req.query; // 'current', 'past', 'future', 'all'

    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      let query = 'SELECT * FROM events WHERE user_id = $1';
      const params = [userId];

      if (filter === 'current') {
        // Current month events
        query += ' AND month = $2';
        params.push(currentMonth);
      } else if (filter === 'past') {
        // Past events this year
        query += ' AND (month < $2 OR (month = $2 AND day < $3))';
        params.push(currentMonth, currentDate.getDate());
      } else if (filter === 'future') {
        // Future events this year
        query += ' AND (month > $2 OR (month = $2 AND day >= $3))';
        params.push(currentMonth, currentDate.getDate());
      }

      query += ' ORDER BY month, day';

      const result = await pool.query(query, params);
      res.json({ events: result.rows });
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
