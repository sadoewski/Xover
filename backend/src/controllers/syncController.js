import pool from '../config/database.js';

const syncController = {
  // Push operations from desktop app
  push: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { operations } = req.body;

      if (!Array.isArray(operations) || operations.length === 0) {
        return res.status(400).json({ error: 'Операции должны быть непустым массивом' });
      }

      const conflicts = [];
      const synced = [];

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const operation of operations) {
          const { table, action, data, timestamp } = operation;

          if (!table || !action || !data || !timestamp) {
            conflicts.push({
              operation,
              reason: 'Отсутствуют обязательные поля (table, action, data, timestamp)'
            });
            continue;
          }

          // Validate table name to prevent SQL injection
          const allowedTables = ['tasks', 'events', 'task_groups', 'priorities', 'sites', 'datatasks', 'event_year_notes'];
          if (!allowedTables.includes(table)) {
            conflicts.push({
              operation,
              reason: `Недопустимая таблица: ${table}`
            });
            continue;
          }

          try {
            let result;
            const operationTimestamp = new Date(timestamp);

            switch (action) {
              case 'insert':
                // Check if record already exists (based on id if provided)
                if (data.id) {
                  const checkQuery = `SELECT id, updated_at FROM ${table} WHERE id = $1 AND user_id = $2`;
                  const checkResult = await client.query(checkQuery, [data.id, userId]);

                  if (checkResult.rows.length > 0) {
                    const existingRecord = checkResult.rows[0];
                    const existingTimestamp = new Date(existingRecord.updated_at);

                    // Conflict detection: server record is newer
                    if (existingTimestamp > operationTimestamp) {
                      conflicts.push({
                        operation,
                        reason: 'Запись на сервере новее',
                        serverTimestamp: existingTimestamp.toISOString(),
                        clientTimestamp: operationTimestamp.toISOString()
                      });
                      continue;
                    }
                  }
                }

                // Build insert query dynamically
                const insertFields = Object.keys(data).filter(key => key !== 'id');
                insertFields.push('user_id');
                const insertValues = insertFields.map((_, i) => `$${i + 1}`);
                const insertData = insertFields.map(field => field === 'user_id' ? userId : data[field]);

                if (data.id) {
                  insertFields.unshift('id');
                  insertValues.unshift(`$${insertFields.length}`);
                  insertData.unshift(data.id);
                }

                const insertQuery = `
                  INSERT INTO ${table} (${insertFields.join(', ')})
                  VALUES (${insertValues.join(', ')})
                  ON CONFLICT (id) DO UPDATE SET
                    ${insertFields.filter(f => f !== 'id' && f !== 'user_id').map(f => `${f} = EXCLUDED.${f}`).join(', ')},
                    updated_at = CURRENT_TIMESTAMP
                  RETURNING id
                `;

                result = await client.query(insertQuery, insertData);
                synced.push({ operation, id: result.rows[0].id });
                break;

              case 'update':
                if (!data.id) {
                  conflicts.push({
                    operation,
                    reason: 'Отсутствует ID для обновления'
                  });
                  continue;
                }

                // Check for conflicts
                const checkUpdateQuery = `SELECT id, updated_at FROM ${table} WHERE id = $1 AND user_id = $2`;
                const checkUpdateResult = await client.query(checkUpdateQuery, [data.id, userId]);

                if (checkUpdateResult.rows.length === 0) {
                  conflicts.push({
                    operation,
                    reason: 'Запись не найдена на сервере'
                  });
                  continue;
                }

                const existingUpdateRecord = checkUpdateResult.rows[0];
                const existingUpdateTimestamp = new Date(existingUpdateRecord.updated_at);

                // Conflict detection: server record is newer
                if (existingUpdateTimestamp > operationTimestamp) {
                  conflicts.push({
                    operation,
                    reason: 'Запись на сервере новее',
                    serverTimestamp: existingUpdateTimestamp.toISOString(),
                    clientTimestamp: operationTimestamp.toISOString()
                  });
                  continue;
                }

                // Build update query dynamically
                const updateFields = Object.keys(data).filter(key => key !== 'id' && key !== 'user_id');
                const updateValues = updateFields.map((field, i) => `${field} = $${i + 1}`);
                const updateData = updateFields.map(field => data[field]);
                updateData.push(data.id, userId);

                const updateQuery = `
                  UPDATE ${table}
                  SET ${updateValues.join(', ')}, updated_at = CURRENT_TIMESTAMP
                  WHERE id = $${updateFields.length + 1} AND user_id = $${updateFields.length + 2}
                  RETURNING id
                `;

                result = await client.query(updateQuery, updateData);
                synced.push({ operation, id: result.rows[0].id });
                break;

              case 'delete':
                if (!data.id) {
                  conflicts.push({
                    operation,
                    reason: 'Отсутствует ID для удаления'
                  });
                  continue;
                }

                // Check if record exists
                const checkDeleteQuery = `SELECT id, updated_at FROM ${table} WHERE id = $1 AND user_id = $2`;
                const checkDeleteResult = await client.query(checkDeleteQuery, [data.id, userId]);

                if (checkDeleteResult.rows.length === 0) {
                  // Record already deleted or doesn't exist - not necessarily a conflict
                  synced.push({ operation, id: data.id, note: 'Запись уже удалена' });
                  continue;
                }

                const existingDeleteRecord = checkDeleteResult.rows[0];
                const existingDeleteTimestamp = new Date(existingDeleteRecord.updated_at);

                // Conflict detection: server record was updated after deletion attempt
                if (existingDeleteTimestamp > operationTimestamp) {
                  conflicts.push({
                    operation,
                    reason: 'Запись была изменена на сервере после попытки удаления',
                    serverTimestamp: existingDeleteTimestamp.toISOString(),
                    clientTimestamp: operationTimestamp.toISOString()
                  });
                  continue;
                }

                const deleteQuery = `DELETE FROM ${table} WHERE id = $1 AND user_id = $2 RETURNING id`;
                result = await client.query(deleteQuery, [data.id, userId]);
                synced.push({ operation, id: data.id });
                break;

              default:
                conflicts.push({
                  operation,
                  reason: `Неизвестное действие: ${action}`
                });
            }
          } catch (operationError) {
            console.error(`Ошибка обработки операции ${action} для таблицы ${table}:`, operationError);
            conflicts.push({
              operation,
              reason: `Ошибка выполнения: ${operationError.message}`
            });
          }
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      res.json({
        conflicts,
        synced,
        summary: {
          total: operations.length,
          synced: synced.length,
          conflicts: conflicts.length
        }
      });
    } catch (error) {
      console.error('Ошибка синхронизации (push):', error);
      res.status(500).json({ error: 'Ошибка синхронизации', details: error.message });
    }
  },

  // Pull changes since last sync
  pull: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }

      const { lastSyncTimestamp } = req.body;

      if (!lastSyncTimestamp) {
        return res.status(400).json({ error: 'Требуется lastSyncTimestamp' });
      }

      const lastSync = new Date(lastSyncTimestamp);
      const operations = [];

      // Tables to sync with their timestamp columns
      const tablesConfig = [
        { name: 'tasks', hasUpdatedAt: true },
        { name: 'events', hasUpdatedAt: true },
        { name: 'task_groups', hasUpdatedAt: false, timestampColumn: 'created_at' },
        { name: 'priorities', hasUpdatedAt: false, timestampColumn: 'created_at' },
        { name: 'sites', hasUpdatedAt: true },
        { name: 'datatasks', hasUpdatedAt: true },
        { name: 'event_year_notes', hasUpdatedAt: true }
      ];

      for (const config of tablesConfig) {
        try {
          const timestampColumn = config.hasUpdatedAt ? 'updated_at' : config.timestampColumn;

          // Get all records updated/created since last sync
          const query = `
            SELECT *, 'update' as sync_action
            FROM ${config.name}
            WHERE user_id = $1 AND ${timestampColumn} > $2
            ORDER BY ${timestampColumn} ASC
          `;

          const result = await pool.query(query, [userId, lastSync]);

          for (const row of result.rows) {
            const { sync_action, ...data } = row;
            operations.push({
              table: config.name,
              action: sync_action,
              data,
              timestamp: row[timestampColumn].toISOString()
            });
          }
        } catch (tableError) {
          console.error(`Ошибка получения данных из таблицы ${config.name}:`, tableError);
          // Continue with other tables
        }
      }

      const currentTimestamp = new Date().toISOString();

      res.json({
        operations,
        timestamp: currentTimestamp,
        summary: {
          operations: operations.length,
          tables: tablesConfig.length
        }
      });
    } catch (error) {
      console.error('Ошибка синхронизации (pull):', error);
      res.status(500).json({ error: 'Ошибка синхронизации', details: error.message });
    }
  },

  // Health check for sync
  status: async (req, res) => {
    try {
      // Check database connection
      const result = await pool.query('SELECT NOW() as server_time');
      const serverTime = result.rows[0].server_time.toISOString();

      res.json({
        connected: true,
        serverTime,
        status: 'ok'
      });
    } catch (error) {
      console.error('Ошибка проверки статуса синхронизации:', error);
      res.status(503).json({
        connected: false,
        error: 'Ошибка подключения к базе данных',
        details: error.message
      });
    }
  }
};

export default syncController;
