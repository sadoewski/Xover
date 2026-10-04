import syncQueue from './queue.js';
import { getDatabaseType } from '../config/database-adapter.js';

/**
 * Sync Processor - Process queue when online
 * Batches operations and sends them to the server
 */

class SyncProcessor {
  constructor() {
    this.isProcessing = false;
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
   * Check if online by pinging sync status endpoint
   */
  async isOnline() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sync/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Process pending operations in the queue
   */
  async process() {
    // Only process in SQLite mode (standalone)
    if (this.dbType !== 'sqlite') {
      console.log('⚠️  Sync processor disabled (PostgreSQL mode)');
      return { success: true, processed: 0, conflicts: 0 };
    }

    if (this.isProcessing) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, reason: 'already_processing' };
    }

    if (!this.authToken) {
      console.log('⚠️  No auth token set, cannot sync');
      return { success: false, reason: 'no_auth_token' };
    }

    // Check if online
    const online = await this.isOnline();
    if (!online) {
      console.log('📡 Server unreachable, staying offline');
      return { success: false, reason: 'offline' };
    }

    this.isProcessing = true;
    console.log('🔄 Starting sync process...');

    try {
      const pending = syncQueue.getPending(100); // Process max 100 ops at once

      if (pending.length === 0) {
        console.log('✓ No pending operations to sync');
        return { success: true, processed: 0, conflicts: 0 };
      }

      console.log(`📤 Syncing ${pending.length} operations...`);

      // Group operations by table for better batching
      const batchedByTable = this.groupByTable(pending);

      let totalProcessed = 0;
      let totalConflicts = 0;

      for (const [tableName, operations] of Object.entries(batchedByTable)) {
        console.log(`  Processing ${operations.length} operations for ${tableName}...`);

        const result = await this.pushBatch(operations);

        if (result.success) {
          totalProcessed += result.synced;
          totalConflicts += result.conflicts;
        } else {
          console.error(`  ❌ Failed to sync batch for ${tableName}:`, result.error);
          // Mark operations for retry
          operations.forEach(op => {
            syncQueue.incrementRetry(op.id);
          });
        }
      }

      console.log(`✓ Sync complete: ${totalProcessed} synced, ${totalConflicts} conflicts`);

      return {
        success: true,
        processed: totalProcessed,
        conflicts: totalConflicts
      };

    } catch (error) {
      console.error('❌ Sync process failed:', error);
      return { success: false, reason: 'error', error: error.message };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Group operations by table name
   */
  groupByTable(operations) {
    const grouped = {};

    for (const op of operations) {
      if (!grouped[op.table]) {
        grouped[op.table] = [];
      }
      grouped[op.table].push(op);
    }

    return grouped;
  }

  /**
   * Push batch of operations to server
   */
  async pushBatch(operations) {
    try {
      const payload = {
        operations: operations.map(op => ({
          table: op.table,
          action: op.action,
          data: op.data,
          timestamp: op.timestamp
        }))
      };

      const response = await fetch(`${this.apiBaseUrl}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Server returned ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();

      // Process synced operations
      if (result.synced && result.synced.length > 0) {
        for (const syncedOp of result.synced) {
          // Find original operation by matching timestamp and data
          const originalOp = operations.find(op =>
            op.timestamp === syncedOp.operation.timestamp &&
            op.action === syncedOp.operation.action
          );

          if (originalOp) {
            syncQueue.markSynced(originalOp.id);
          }
        }
      }

      // Process conflicts
      if (result.conflicts && result.conflicts.length > 0) {
        for (const conflict of result.conflicts) {
          // Find original operation
          const originalOp = operations.find(op =>
            op.timestamp === conflict.operation.timestamp &&
            op.action === conflict.operation.action
          );

          if (originalOp) {
            syncQueue.markConflict(originalOp.id, conflict.reason);
          }
        }
      }

      return {
        success: true,
        synced: result.synced?.length || 0,
        conflicts: result.conflicts?.length || 0
      };

    } catch (error) {
      console.error('❌ Push batch failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Auto-sync on interval (call this periodically)
   */
  async autoSync() {
    const stats = syncQueue.getStats();

    if (stats.pending > 0) {
      console.log(`🔄 Auto-sync triggered (${stats.pending} pending operations)`);
      return await this.process();
    } else {
      console.log('✓ No pending operations for auto-sync');
      return { success: true, processed: 0, conflicts: 0 };
    }
  }

  /**
   * Get current sync status
   */
  getStatus() {
    const stats = syncQueue.getStats();

    return {
      processing: this.isProcessing,
      hasAuthToken: !!this.authToken,
      queueStats: stats,
      dbType: this.dbType,
      enabled: this.dbType === 'sqlite'
    };
  }
}

// Singleton instance
const syncProcessor = new SyncProcessor();

export default syncProcessor;
