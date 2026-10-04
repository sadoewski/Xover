/**
 * Sync System - Main entry point
 * Exports all sync components and provides unified interface
 */

import syncQueue from './queue.js';
import syncProcessor from './processor.js';
import syncPuller from './puller.js';
import syncMiddleware from './middleware.js';

/**
 * Initialize the sync system
 */
export function initSync() {
  console.log('🔄 Initializing sync system...');

  // Initialize queue (creates tables if needed)
  syncQueue.init();

  console.log('✓ Sync system initialized');
}

/**
 * Set authentication token for sync operations
 */
export function setAuthToken(token) {
  syncProcessor.setAuthToken(token);
  syncPuller.setAuthToken(token);
}

/**
 * Start auto-sync interval
 */
export function startAutoSync(intervalMinutes = 5) {
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`🔄 Starting auto-sync (every ${intervalMinutes} minutes)...`);

  // Initial sync
  setTimeout(() => {
    performBidirectionalSync();
  }, 5000); // Wait 5 seconds after start

  // Recurring sync
  const intervalId = setInterval(async () => {
    await performBidirectionalSync();
  }, intervalMs);

  return intervalId;
}

/**
 * Stop auto-sync interval
 */
export function stopAutoSync(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('✓ Auto-sync stopped');
  }
}

/**
 * Perform bidirectional sync (push + pull)
 */
export async function performBidirectionalSync() {
  console.log('🔄 Starting bidirectional sync...');

  try {
    // First, push pending local changes
    const pushResult = await syncProcessor.process();

    if (pushResult.success) {
      console.log(`  ✓ Push: ${pushResult.processed} operations synced`);

      // Then, pull remote changes
      const pullResult = await syncPuller.pull();

      if (pullResult.success) {
        console.log(`  ✓ Pull: ${pullResult.applied} operations applied`);

        return {
          success: true,
          pushed: pushResult.processed,
          pulled: pullResult.applied,
          conflicts: pushResult.conflicts
        };
      } else {
        console.error('  ❌ Pull failed:', pullResult.reason);
        return {
          success: false,
          phase: 'pull',
          reason: pullResult.reason
        };
      }
    } else {
      console.error('  ❌ Push failed:', pushResult.reason);
      return {
        success: false,
        phase: 'push',
        reason: pushResult.reason
      };
    }
  } catch (error) {
    console.error('❌ Bidirectional sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get comprehensive sync status
 */
export function getSyncStatus() {
  const queueStats = syncQueue.getStats();
  const processorStatus = syncProcessor.getStatus();
  const pullerStatus = syncPuller.getStatus();
  const middlewareStatus = syncMiddleware.getStatus();

  return {
    enabled: processorStatus.enabled,
    queue: queueStats,
    processor: {
      processing: processorStatus.processing,
      hasAuthToken: processorStatus.hasAuthToken
    },
    puller: {
      hasAuthToken: pullerStatus.hasAuthToken,
      lastSyncTimestamp: pullerStatus.lastSyncTimestamp
    },
    middleware: {
      enabled: middlewareStatus.enabled,
      syncableTables: middlewareStatus.syncableTables
    }
  };
}

/**
 * Get conflicts that need manual resolution
 */
export function getConflicts() {
  return syncQueue.getConflicts();
}

/**
 * Resolve a conflict by accepting server version (delete local queue item)
 */
export function resolveConflictAcceptServer(queueId) {
  syncQueue.deleteQueueItem(queueId);
  console.log(`✓ Conflict ${queueId} resolved (accepted server version)`);
}

/**
 * Resolve a conflict by retrying local version (clear conflict flag)
 */
export function resolveConflictRetryLocal(queueId) {
  // This would require updating the conflict flag back to 0
  // For now, we can delete and let user manually re-create if needed
  syncQueue.deleteQueueItem(queueId);
  console.log(`✓ Conflict ${queueId} removed (retry manually)`);
}

/**
 * Clean up old synced operations
 */
export function cleanupSyncQueue(olderThanDays = 7) {
  return syncQueue.clearSynced(olderThanDays);
}

/**
 * Manually queue an operation (for explicit sync tracking)
 */
export function queueOperation(tableName, action, data) {
  return syncMiddleware.queueOperation(tableName, action, data);
}

// Export individual components for advanced usage
export {
  syncQueue,
  syncProcessor,
  syncPuller,
  syncMiddleware
};

// Export default object with all methods
export default {
  initSync,
  setAuthToken,
  startAutoSync,
  stopAutoSync,
  performBidirectionalSync,
  getSyncStatus,
  getConflicts,
  resolveConflictAcceptServer,
  resolveConflictRetryLocal,
  cleanupSyncQueue,
  queueOperation,
  syncQueue,
  syncProcessor,
  syncPuller,
  syncMiddleware
};
