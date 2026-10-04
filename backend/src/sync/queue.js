import { db } from '../config/database-sqlite.js';
import { getDatabaseType } from '../config/database-adapter.js';

/**
 * Sync Queue - Local SQLite table for pending sync operations
 * Stores all INSERT/UPDATE/DELETE operations when offline or during sync failures
 */

class SyncQueue {
  constructor() {
    this.dbType = getDatabaseType();
    this.isInitialized = false;
  }

  /**
   * Initialize the sync queue table
   */
  init() {
    if (this.isInitialized) return;

    // Only create queue for SQLite (standalone mode)
    if (this.dbType !== 'sqlite') {
      console.log('⚠️  Sync queue disabled (PostgreSQL mode)');
      this.isInitialized = true;
      return;
    }

    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
          data_json TEXT NOT NULL,
          timestamp TEXT NOT NULL DEFAULT (datetime('now')),
          synced BOOLEAN NOT NULL DEFAULT 0,
          conflict BOOLEAN NOT NULL DEFAULT 0,
          conflict_reason TEXT,
          retry_count INTEGER NOT NULL DEFAULT 0,
          last_retry TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);
      `);

      // Create table for tracking last sync timestamp
      db.exec(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      this.isInitialized = true;
      console.log('✓ Sync queue initialized');
    } catch (error) {
      console.error('❌ Failed to initialize sync queue:', error);
      throw error;
    }
  }

  /**
   * Add operation to sync queue
   */
  enqueue(tableName, action, data) {
    if (this.dbType !== 'sqlite') {
      // Skip queueing in PostgreSQL mode
      return null;
    }

    this.init();

    const dataJson = JSON.stringify(data);
    const timestamp = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO sync_queue (table_name, action, data_json, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(tableName, action.toUpperCase(), dataJson, timestamp);

    console.log(`📝 Queued ${action} for ${tableName} (queue_id: ${result.lastInsertRowid})`);
    return result.lastInsertRowid;
  }

  /**
   * Get all pending (unsynced) operations
   */
  getPending(limit = 100) {
    if (this.dbType !== 'sqlite') return [];

    this.init();

    const stmt = db.prepare(`
      SELECT id, table_name, action, data_json, timestamp, retry_count
      FROM sync_queue
      WHERE synced = 0 AND conflict = 0
      ORDER BY timestamp ASC
      LIMIT ?
    `);

    const rows = stmt.all(limit);
    return rows.map(row => ({
      id: row.id,
      table: row.table_name,
      action: row.action.toLowerCase(),
      data: JSON.parse(row.data_json),
      timestamp: row.timestamp,
      retryCount: row.retry_count
    }));
  }

  /**
   * Mark operation as synced
   */
  markSynced(queueId) {
    if (this.dbType !== 'sqlite') return;

    this.init();

    const stmt = db.prepare(`
      UPDATE sync_queue
      SET synced = 1, conflict = 0
      WHERE id = ?
    `);

    stmt.run(queueId);
    console.log(`✓ Marked queue item ${queueId} as synced`);
  }

  /**
   * Mark operation as conflicted
   */
  markConflict(queueId, reason) {
    if (this.dbType !== 'sqlite') return;

    this.init();

    const stmt = db.prepare(`
      UPDATE sync_queue
      SET conflict = 1, conflict_reason = ?
      WHERE id = ?
    `);

    stmt.run(reason, queueId);
    console.log(`⚠️  Marked queue item ${queueId} as conflicted: ${reason}`);
  }

  /**
   * Increment retry count for failed operation
   */
  incrementRetry(queueId) {
    if (this.dbType !== 'sqlite') return;

    this.init();

    const stmt = db.prepare(`
      UPDATE sync_queue
      SET retry_count = retry_count + 1, last_retry = datetime('now')
      WHERE id = ?
    `);

    stmt.run(queueId);
  }

  /**
   * Get conflicted operations
   */
  getConflicts() {
    if (this.dbType !== 'sqlite') return [];

    this.init();

    const stmt = db.prepare(`
      SELECT id, table_name, action, data_json, timestamp, conflict_reason
      FROM sync_queue
      WHERE conflict = 1
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all();
    return rows.map(row => ({
      id: row.id,
      table: row.table_name,
      action: row.action.toLowerCase(),
      data: JSON.parse(row.data_json),
      timestamp: row.timestamp,
      reason: row.conflict_reason
    }));
  }

  /**
   * Clear synced operations (cleanup)
   */
  clearSynced(olderThanDays = 7) {
    if (this.dbType !== 'sqlite') return 0;

    this.init();

    const stmt = db.prepare(`
      DELETE FROM sync_queue
      WHERE synced = 1
      AND created_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(olderThanDays);
    console.log(`🧹 Cleaned up ${result.changes} old synced operations`);
    return result.changes;
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTimestamp() {
    if (this.dbType !== 'sqlite') return null;

    this.init();

    const stmt = db.prepare(`
      SELECT value FROM sync_metadata WHERE key = 'last_sync_timestamp'
    `);

    const row = stmt.get();
    return row ? row.value : null;
  }

  /**
   * Update last sync timestamp
   */
  updateLastSyncTimestamp(timestamp) {
    if (this.dbType !== 'sqlite') return;

    this.init();

    const stmt = db.prepare(`
      INSERT INTO sync_metadata (key, value, updated_at)
      VALUES ('last_sync_timestamp', ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    stmt.run(timestamp || new Date().toISOString());
  }

  /**
   * Get queue statistics
   */
  getStats() {
    if (this.dbType !== 'sqlite') {
      return { pending: 0, synced: 0, conflicts: 0, total: 0 };
    }

    this.init();

    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN synced = 0 AND conflict = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN synced = 1 THEN 1 ELSE 0 END) as synced,
        SUM(CASE WHEN conflict = 1 THEN 1 ELSE 0 END) as conflicts
      FROM sync_queue
    `);

    const row = stmt.get();
    return {
      pending: row.pending || 0,
      synced: row.synced || 0,
      conflicts: row.conflicts || 0,
      total: row.total || 0
    };
  }

  /**
   * Delete a specific queue item (for conflict resolution)
   */
  deleteQueueItem(queueId) {
    if (this.dbType !== 'sqlite') return;

    this.init();

    const stmt = db.prepare(`DELETE FROM sync_queue WHERE id = ?`);
    stmt.run(queueId);
    console.log(`🗑️  Deleted queue item ${queueId}`);
  }
}

// Singleton instance
const syncQueue = new SyncQueue();

export default syncQueue;
