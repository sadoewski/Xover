# Sync Queue System

This directory contains the offline-first sync system for the Hostprint application.

## Overview

The sync system enables the desktop app to work offline by queuing all database operations locally and syncing them with the server when online. It supports bidirectional synchronization with conflict detection and resolution.

## Components

### 1. `queue.js` - Local SQLite Queue
Manages a local queue table for pending sync operations.

**Schema:**
```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
  data_json TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  synced BOOLEAN NOT NULL DEFAULT 0,
  conflict BOOLEAN NOT NULL DEFAULT 0,
  conflict_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_retry TEXT,
  created_at TEXT NOT NULL
);
```

**Key Methods:**
- `enqueue(tableName, action, data)` - Add operation to queue
- `getPending(limit)` - Get unsynced operations
- `markSynced(queueId)` - Mark operation as synced
- `markConflict(queueId, reason)` - Mark operation as conflicted
- `getConflicts()` - Get all conflicted operations
- `getStats()` - Get queue statistics
- `clearSynced(olderThanDays)` - Cleanup old synced operations

### 2. `processor.js` - Push Processor
Processes the queue and pushes operations to the server.

**Key Methods:**
- `setAuthToken(token)` - Set authentication token
- `isOnline()` - Check server connectivity
- `process()` - Process pending queue items
- `pushBatch(operations)` - Send batch to server
- `autoSync()` - Auto-sync pending operations
- `getStatus()` - Get processor status

**Workflow:**
1. Check if online
2. Get pending operations from queue
3. Group by table for batching
4. Send to `/api/sync/push`
5. Handle server response (synced/conflicts)
6. Mark queue items accordingly

### 3. `puller.js` - Pull Processor
Pulls remote changes from the server and applies them locally.

**Key Methods:**
- `setAuthToken(token)` - Set authentication token
- `pull()` - Pull changes since last sync
- `applyOperation(operation)` - Apply single operation to local DB
- `upsertRecord(tableName, data)` - Insert or update record
- `deleteRecord(tableName, recordId)` - Delete record
- `fullSync()` - Reset and pull all data

**Workflow:**
1. Get last sync timestamp from metadata
2. Call `/api/sync/pull` with timestamp
3. Apply each operation to local database
4. Update last sync timestamp

### 4. `middleware.js` - DB Write Interceptor
Automatically intercepts and queues database write operations.

**Key Methods:**
- `wrapQuery(pool)` - Wrap pool.query to intercept writes
- `interceptQuery(text, params, result)` - Analyze and queue operation
- `queueOperation(tableName, action, data)` - Manually queue operation
- `getStatus()` - Get middleware status

**Syncable Tables:**
- `tasks`
- `events`
- `task_groups`
- `priorities`
- `sites`
- `datatasks`
- `event_year_notes`

### 5. `index.js` - Main Entry Point
Unified interface for the sync system.

**Key Functions:**
- `initSync()` - Initialize sync system
- `setAuthToken(token)` - Set auth token for all components
- `startAutoSync(intervalMinutes)` - Start automatic sync
- `stopAutoSync(intervalId)` - Stop automatic sync
- `performBidirectionalSync()` - Push + Pull in sequence
- `getSyncStatus()` - Get comprehensive status
- `getConflicts()` - Get unresolved conflicts
- `resolveConflictAcceptServer(queueId)` - Accept server version
- `cleanupSyncQueue(olderThanDays)` - Cleanup old records

## Usage

### Initialize on App Start

```javascript
import sync from './sync/index.js';

// Initialize sync system
sync.initSync();

// Set auth token after login
sync.setAuthToken(userAuthToken);

// Start auto-sync (every 5 minutes)
const syncInterval = sync.startAutoSync(5);
```

### Manual Sync

```javascript
// Perform bidirectional sync
const result = await sync.performBidirectionalSync();

if (result.success) {
  console.log(`Pushed: ${result.pushed}, Pulled: ${result.pulled}`);
}
```

### Check Sync Status

```javascript
const status = sync.getSyncStatus();

console.log(`Queue: ${status.queue.pending} pending, ${status.queue.conflicts} conflicts`);
console.log(`Last sync: ${status.puller.lastSyncTimestamp}`);
```

### Handle Conflicts

```javascript
const conflicts = sync.getConflicts();

conflicts.forEach(conflict => {
  console.log(`Conflict in ${conflict.table}: ${conflict.reason}`);
  
  // Resolve by accepting server version
  sync.resolveConflictAcceptServer(conflict.id);
});
```

### Manual Operation Queuing

```javascript
// Queue a specific operation
sync.queueOperation('tasks', 'UPDATE', {
  id: 123,
  title: 'Updated Task',
  updated_at: new Date().toISOString()
});
```

## How It Works

### Offline Operation

1. User performs action (create/update/delete)
2. Controller writes to local SQLite database
3. Sync middleware intercepts the write
4. Operation is added to sync_queue table
5. User continues working offline

### Online Sync (Automatic)

**Push Phase:**
1. Processor checks if online
2. Gets pending operations from queue
3. Batches by table and sends to server
4. Server validates and applies operations
5. Server returns synced operations and conflicts
6. Queue items are marked as synced or conflicted

**Pull Phase:**
1. Puller requests changes since last sync
2. Server returns all changes for user
3. Puller applies changes to local database
4. Last sync timestamp is updated

### Conflict Resolution

Conflicts occur when:
- Server record is newer than local operation
- Record doesn't exist on server (for UPDATE/DELETE)
- Validation fails on server

**Handling:**
- Conflicted operations remain in queue
- User is notified via `getConflicts()`
- Manual resolution required:
  - Accept server version: delete queue item
  - Retry local version: user must manually fix and retry

## Database Mode Detection

The sync system automatically detects the database mode:

- **SQLite mode (standalone):** Sync system is **enabled**
  - All operations are queued
  - Bidirectional sync is active
  
- **PostgreSQL mode (server):** Sync system is **disabled**
  - Direct database writes
  - No queue operations
  - Server acts as source of truth

## API Endpoints

The sync system expects these endpoints on the server:

### `GET /api/sync/status`
Health check for sync connectivity.

**Response:**
```json
{
  "connected": true,
  "serverTime": "2024-10-04T23:00:00.000Z",
  "status": "ok"
}
```

### `POST /api/sync/push`
Push batch of operations to server.

**Request:**
```json
{
  "operations": [
    {
      "table": "tasks",
      "action": "insert",
      "data": { "id": 1, "title": "Task 1", ... },
      "timestamp": "2024-10-04T22:00:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "synced": [{ "operation": {...}, "id": 1 }],
  "conflicts": [{ "operation": {...}, "reason": "..." }],
  "summary": { "total": 10, "synced": 8, "conflicts": 2 }
}
```

### `POST /api/sync/pull`
Pull changes since last sync.

**Request:**
```json
{
  "lastSyncTimestamp": "2024-10-04T20:00:00.000Z"
}
```

**Response:**
```json
{
  "operations": [
    {
      "table": "tasks",
      "action": "update",
      "data": { "id": 1, "title": "Updated Task", ... },
      "timestamp": "2024-10-04T21:00:00.000Z"
    }
  ],
  "timestamp": "2024-10-04T23:00:00.000Z",
  "summary": { "operations": 15, "tables": 7 }
}
```

## Cleanup

Run periodic cleanup to remove old synced operations:

```javascript
// Clean up operations older than 7 days
const removed = sync.cleanupSyncQueue(7);
console.log(`Cleaned up ${removed} old operations`);
```

## Limitations

- Maximum 100 operations per batch
- 30 second timeout for push/pull requests
- Conflicts require manual resolution
- No automatic conflict resolution strategies
- Queue grows unbounded if never synced (cleanup recommended)

## Future Enhancements

- [ ] Automatic conflict resolution strategies (last-write-wins, merge, etc.)
- [ ] Delta sync for large records
- [ ] Compression for large batches
- [ ] Real-time sync via WebSocket
- [ ] Optimistic locking with version numbers
- [ ] Batch operation limits and pagination
- [ ] Sync progress indicators
- [ ] Selective table sync
