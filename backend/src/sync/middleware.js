import syncQueue from './queue.js';
import { getDatabaseType } from '../config/database-adapter.js';

/**
 * Sync Middleware - Intercept all DB writes and add to queue
 * Automatically queues INSERT/UPDATE/DELETE operations for sync
 */

class SyncMiddleware {
  constructor() {
    this.dbType = getDatabaseType();
    this.enabled = this.dbType === 'sqlite';
    this.syncableTables = [
      'tasks',
      'events',
      'task_groups',
      'priorities',
      'sites',
      'datatasks',
      'event_year_notes'
    ];
  }

  /**
   * Check if table should be synced
   */
  isSyncable(tableName) {
    return this.syncableTables.includes(tableName);
  }

  /**
   * Wrap INSERT operation
   */
  wrapInsert(tableName, data, originalInsertFn) {
    return async (...args) => {
      // Execute original insert
      const result = await originalInsertFn(...args);

      // Queue for sync if enabled and table is syncable
      if (this.enabled && this.isSyncable(tableName)) {
        try {
          // Extract inserted data (result varies by implementation)
          const insertedData = this.extractInsertedData(result, data);
          syncQueue.enqueue(tableName, 'INSERT', insertedData);
        } catch (error) {
          console.error(`⚠️  Failed to queue INSERT for ${tableName}:`, error);
          // Don't fail the original operation
        }
      }

      return result;
    };
  }

  /**
   * Wrap UPDATE operation
   */
  wrapUpdate(tableName, data, originalUpdateFn) {
    return async (...args) => {
      // Execute original update
      const result = await originalUpdateFn(...args);

      // Queue for sync if enabled and table is syncable
      if (this.enabled && this.isSyncable(tableName)) {
        try {
          // Extract updated data
          const updatedData = this.extractUpdatedData(result, data);
          syncQueue.enqueue(tableName, 'UPDATE', updatedData);
        } catch (error) {
          console.error(`⚠️  Failed to queue UPDATE for ${tableName}:`, error);
          // Don't fail the original operation
        }
      }

      return result;
    };
  }

  /**
   * Wrap DELETE operation
   */
  wrapDelete(tableName, recordId, originalDeleteFn) {
    return async (...args) => {
      // Execute original delete
      const result = await originalDeleteFn(...args);

      // Queue for sync if enabled and table is syncable
      if (this.enabled && this.isSyncable(tableName)) {
        try {
          syncQueue.enqueue(tableName, 'DELETE', { id: recordId });
        } catch (error) {
          console.error(`⚠️  Failed to queue DELETE for ${tableName}:`, error);
          // Don't fail the original operation
        }
      }

      return result;
    };
  }

  /**
   * Wrap a pool.query call to intercept writes
   */
  wrapQuery(pool) {
    const originalQuery = pool.query.bind(pool);

    pool.query = async (text, params = []) => {
      // Execute original query
      const result = await originalQuery(text, params);

      // Check if this is a write operation that should be queued
      if (this.enabled) {
        try {
          this.interceptQuery(text, params, result);
        } catch (error) {
          console.error('⚠️  Failed to intercept query for sync:', error);
          // Don't fail the original operation
        }
      }

      return result;
    };

    return pool;
  }

  /**
   * Intercept and analyze query to queue for sync
   */
  interceptQuery(queryText, params, result) {
    const upperQuery = queryText.trim().toUpperCase();

    // Extract table name and operation type
    let tableName = null;
    let operation = null;

    if (upperQuery.startsWith('INSERT INTO')) {
      const match = queryText.match(/INSERT INTO\s+(\w+)/i);
      tableName = match ? match[1] : null;
      operation = 'INSERT';
    } else if (upperQuery.startsWith('UPDATE')) {
      const match = queryText.match(/UPDATE\s+(\w+)/i);
      tableName = match ? match[1] : null;
      operation = 'UPDATE';
    } else if (upperQuery.startsWith('DELETE FROM')) {
      const match = queryText.match(/DELETE FROM\s+(\w+)/i);
      tableName = match ? match[1] : null;
      operation = 'DELETE';
    }

    // Skip if not a syncable table
    if (!tableName || !this.isSyncable(tableName)) {
      return;
    }

    // Skip if this is a sync queue table operation (prevent recursion)
    if (tableName === 'sync_queue' || tableName === 'sync_metadata') {
      return;
    }

    try {
      // Try to reconstruct data from query and params
      const data = this.reconstructDataFromQuery(queryText, params, result);

      if (data) {
        syncQueue.enqueue(tableName, operation, data);
      }
    } catch (error) {
      console.error(`⚠️  Failed to reconstruct data for sync queue:`, error);
    }
  }

  /**
   * Extract inserted data from result
   */
  extractInsertedData(result, originalData) {
    // If result has rows with RETURNING clause
    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    }

    // If result has insertId
    if (result.insertId) {
      return { ...originalData, id: result.insertId };
    }

    // Fallback to original data
    return originalData;
  }

  /**
   * Extract updated data from result
   */
  extractUpdatedData(result, originalData) {
    // If result has rows with RETURNING clause
    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    }

    // Fallback to original data
    return originalData;
  }

  /**
   * Reconstruct data object from SQL query and parameters
   */
  reconstructDataFromQuery(queryText, params, result) {
    const upperQuery = queryText.trim().toUpperCase();

    if (upperQuery.startsWith('INSERT INTO')) {
      // Try to extract field names from INSERT statement
      const fieldMatch = queryText.match(/INSERT INTO\s+\w+\s*\(([^)]+)\)/i);
      if (fieldMatch && params.length > 0) {
        const fields = fieldMatch[1].split(',').map(f => f.trim());
        const data = {};

        fields.forEach((field, index) => {
          if (index < params.length) {
            data[field] = params[index];
          }
        });

        // Add ID from result if available
        if (result.insertId) {
          data.id = result.insertId;
        } else if (result.rows && result.rows.length > 0 && result.rows[0].id) {
          data.id = result.rows[0].id;
        }

        return data;
      }
    } else if (upperQuery.startsWith('UPDATE')) {
      // Try to extract SET clause and WHERE clause
      const setMatch = queryText.match(/SET\s+(.+?)\s+WHERE/is);
      const whereMatch = queryText.match(/WHERE\s+(.+?)(?:RETURNING|$)/is);

      if (setMatch && whereMatch) {
        const data = {};

        // Parse SET clause (simplified - assumes field = $N format)
        const setClause = setMatch[1];
        const fieldMatches = setClause.matchAll(/(\w+)\s*=\s*\$(\d+)/g);

        for (const match of fieldMatches) {
          const fieldName = match[1];
          const paramIndex = parseInt(match[2]) - 1;
          if (paramIndex < params.length) {
            data[fieldName] = params[paramIndex];
          }
        }

        // Parse WHERE clause to get ID
        if (whereMatch[1].includes('id')) {
          const idMatch = whereMatch[1].match(/id\s*=\s*\$(\d+)/);
          if (idMatch) {
            const idParamIndex = parseInt(idMatch[1]) - 1;
            if (idParamIndex < params.length) {
              data.id = params[idParamIndex];
            }
          }
        }

        return Object.keys(data).length > 0 ? data : null;
      }
    } else if (upperQuery.startsWith('DELETE FROM')) {
      // Parse WHERE clause to get ID
      const whereMatch = queryText.match(/WHERE\s+(.+?)(?:RETURNING|$)/is);

      if (whereMatch && whereMatch[1].includes('id')) {
        const idMatch = whereMatch[1].match(/id\s*=\s*\$(\d+)/);
        if (idMatch) {
          const idParamIndex = parseInt(idMatch[1]) - 1;
          if (idParamIndex < params.length) {
            return { id: params[idParamIndex] };
          }
        }
      }
    }

    return null;
  }

  /**
   * Create a middleware wrapper for database operations
   */
  createDbWrapper(pool) {
    if (!this.enabled) {
      return pool; // Return unwrapped pool if sync is disabled
    }

    return this.wrapQuery(pool);
  }

  /**
   * Manually queue an operation (for direct usage in controllers)
   */
  queueOperation(tableName, action, data) {
    if (this.enabled && this.isSyncable(tableName)) {
      return syncQueue.enqueue(tableName, action, data);
    }
    return null;
  }

  /**
   * Get middleware status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      dbType: this.dbType,
      syncableTables: this.syncableTables
    };
  }
}

// Singleton instance
const syncMiddleware = new SyncMiddleware();

export default syncMiddleware;
