import pool from '../config/database.js';
import { getDatabaseType } from '../config/database-adapter.js';
import syncQueue from './queue.js';

/**
 * Sync Puller - Pull remote changes from server
 * Fetches updates since last sync and applies them to local database
 */

class SyncPuller {
  constructor() {
    this.apiBaseUrl = process.env.API_URL || 'http://localhost:3000';
    this.authToken = null;
    this.dbType = getDatabaseType();
  }

  /**
   * Set authentication token for sync requests
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Pull changes from server since last sync
   */
  async pull() {
    // Only pull in SQLite mode (standalone)
    if (this.dbType !== 'sqlite') {
      console.log('⚠️  Sync puller disabled (PostgreSQL mode)');
      return { success: true, applied: 0 };
    }

    if (!this.authToken) {
      console.log('⚠️  No auth token set, cannot pull');
      return { success: false, reason: 'no_auth_token' };
    }

    try {
      const lastSyncTimestamp = syncQueue.getLastSyncTimestamp();

      // If no last sync, use a very old timestamp to get all data
      const timestamp = lastSyncTimestamp || new Date('2020-01-01').toISOString();

      console.log(`📥 Pulling changes since ${timestamp}...`);

      const response = await fetch(`${this.apiBaseUrl}/api/sync/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ lastSyncTimestamp: timestamp }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Server returned ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      const operations = result.operations || [];

      console.log(`📦 Received ${operations.length} operations from server`);

      if (operations.length === 0) {
        // Update last sync timestamp even if no operations
        syncQueue.updateLastSyncTimestamp(result.timestamp);
        return { success: true, applied: 0 };
      }

      // Apply operations to local database
      let applied = 0;
      let skipped = 0;

      for (const operation of operations) {
        try {
          const success = await this.applyOperation(operation);
          if (success) {
            applied++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`❌ Failed to apply operation:`, error);
          console.error(`   Operation:`, operation);
          skipped++;
        }
      }

      // Update last sync timestamp
      syncQueue.updateLastSyncTimestamp(result.timestamp);

      console.log(`✓ Pull complete: ${applied} applied, ${skipped} skipped`);

      return {
        success: true,
        applied,
        skipped,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error('❌ Pull failed:', error);
      return {
        success: false,
        reason: 'error',
        error: error.message
      };
    }
  }

  /**
   * Apply a single operation to local database
   */
  async applyOperation(operation) {
    const { table, action, data, timestamp } = operation;

    try {
      switch (action) {
        case 'update':
        case 'insert':
          return await this.upsertRecord(table, data);

        case 'delete':
          return await this.deleteRecord(table, data.id);

        default:
          console.warn(`⚠️  Unknown action: ${action}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Error applying ${action} to ${table}:`, error);
      throw error;
    }
  }

  /**
   * Upsert (insert or update) record in local database
   */
  async upsertRecord(tableName, data) {
    try {
      // Check if record exists
      const checkQuery = `SELECT id FROM ${tableName} WHERE id = ?`;
      const checkResult = await pool.query(checkQuery, [data.id]);

      if (checkResult.rows && checkResult.rows.length > 0) {
        // Update existing record
        const fields = Object.keys(data).filter(key => key !== 'id');
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => data[field]);
        values.push(data.id);

        const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
        await pool.query(updateQuery, values);

        console.log(`  ✓ Updated ${tableName} record ${data.id}`);
        return true;
      } else {
        // Insert new record
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(field => data[field]);

        const insertQuery = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        await pool.query(insertQuery, values);

        console.log(`  ✓ Inserted ${tableName} record ${data.id}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Upsert failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete record from local database
   */
  async deleteRecord(tableName, recordId) {
    try {
      const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
      const result = await pool.query(deleteQuery, [recordId]);

      if (result.rowCount > 0) {
        console.log(`  ✓ Deleted ${tableName} record ${recordId}`);
        return true;
      } else {
        console.log(`  ⚠️  Record ${recordId} not found in ${tableName} (already deleted?)`);
        return true; // Not an error - record is gone either way
      }
    } catch (error) {
      console.error(`❌ Delete failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Full sync - pull all changes
   */
  async fullSync() {
    // Reset last sync timestamp to force full pull
    syncQueue.updateLastSyncTimestamp(new Date('2020-01-01').toISOString());

    console.log('🔄 Starting full sync...');
    return await this.pull();
  }

  /**
   * Get puller status
   */
  getStatus() {
    return {
      hasAuthToken: !!this.authToken,
      lastSyncTimestamp: syncQueue.getLastSyncTimestamp(),
      dbType: this.dbType,
      enabled: this.dbType === 'sqlite'
    };
  }
}

// Singleton instance
const syncPuller = new SyncPuller();

export default syncPuller;
