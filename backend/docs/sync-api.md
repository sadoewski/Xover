# Sync API Documentation

## Overview

The Sync API enables synchronization between the desktop application and the server. It supports batch operations with conflict detection based on timestamps.

## Authentication

All sync endpoints require authentication using JWT Bearer tokens:

```
Authorization: Bearer <token>
```

## Endpoints

### GET /api/sync/status

Health check endpoint for the sync service.

**Response:**
```json
{
  "connected": true,
  "serverTime": "2026-10-04T19:00:00.000Z",
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` - Service is operational
- `401 Unauthorized` - Missing or invalid authentication token
- `503 Service Unavailable` - Database connection error

---

### POST /api/sync/push

Push batch operations from the desktop app to the server.

**Request Body:**
```json
{
  "operations": [
    {
      "table": "events",
      "action": "insert|update|delete",
      "data": {
        "id": 123,
        "name": "Birthday Party",
        "type": "birthday",
        "month": 5,
        "day": 15,
        "date": "2026-05-15",
        "is_yearly": true
      },
      "timestamp": "2026-10-04T19:00:00.000Z"
    }
  ]
}
```

**Supported Tables:**
- `tasks`
- `events`
- `task_groups`
- `priorities`
- `sites`
- `datatasks`
- `event_year_notes`

**Supported Actions:**
- `insert` - Create a new record (uses upsert if id is provided)
- `update` - Update an existing record (requires id in data)
- `delete` - Delete a record (requires id in data)

**Response:**
```json
{
  "conflicts": [
    {
      "operation": { /* original operation */ },
      "reason": "Запись на сервере новее",
      "serverTimestamp": "2026-10-04T19:01:00.000Z",
      "clientTimestamp": "2026-10-04T19:00:00.000Z"
    }
  ],
  "synced": [
    {
      "operation": { /* original operation */ },
      "id": 123
    }
  ],
  "summary": {
    "total": 10,
    "synced": 9,
    "conflicts": 1
  }
}
```

**Conflict Detection:**

The API compares timestamps to detect conflicts:
- If the server record has a newer `updated_at` timestamp than the operation's timestamp, a conflict is returned
- The operation is not applied, and the client should resolve the conflict
- Conflicts include both server and client timestamps for resolution

**Status Codes:**
- `200 OK` - Request processed (check conflicts/synced arrays)
- `400 Bad Request` - Invalid request format or missing required fields
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database error

---

### POST /api/sync/pull

Retrieve changes from the server since the last sync.

**Request Body:**
```json
{
  "lastSyncTimestamp": "2026-10-04T18:00:00.000Z"
}
```

**Response:**
```json
{
  "operations": [
    {
      "table": "events",
      "action": "update",
      "data": {
        "id": 123,
        "user_id": 1,
        "type": "birthday",
        "name": "Birthday Party",
        "month": 5,
        "day": 15,
        "date": "2026-05-15",
        "is_yearly": true,
        "created_at": "2026-10-04T18:30:00.000Z",
        "updated_at": "2026-10-04T19:00:00.000Z"
      },
      "timestamp": "2026-10-04T19:00:00.000Z"
    }
  ],
  "timestamp": "2026-10-04T19:05:00.000Z",
  "summary": {
    "operations": 5,
    "tables": 7
  }
}
```

**Notes:**
- Returns all records modified after `lastSyncTimestamp`
- For tables without `updated_at` (priorities, task_groups), uses `created_at`
- Operations are ordered by timestamp (ascending)
- The returned `timestamp` should be used as `lastSyncTimestamp` for the next pull

**Status Codes:**
- `200 OK` - Changes retrieved successfully
- `400 Bad Request` - Missing or invalid lastSyncTimestamp
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database error

---

## Example Workflow

### Initial Sync

1. Desktop app calls `/api/sync/status` to verify connectivity
2. Desktop app calls `/api/sync/pull` with lastSyncTimestamp = epoch or app installation time
3. Desktop app applies received operations locally

### Push Local Changes

1. Desktop app accumulates local changes with timestamps
2. Desktop app calls `/api/sync/push` with batch of operations
3. Desktop app handles any conflicts returned:
   - Update local records with server data from conflicts
   - Re-apply user's changes if appropriate
   - Ask user to resolve conflicts manually if needed

### Pull Remote Changes

1. Desktop app periodically calls `/api/sync/pull` with last known sync timestamp
2. Desktop app applies received operations to local database
3. Desktop app stores the returned timestamp for next pull

### Conflict Resolution

When a conflict occurs:
1. Server returns the conflict with both timestamps
2. Client should fetch the current server state
3. Client decides resolution strategy:
   - Server wins: discard local change
   - Client wins: re-push with current timestamp
   - Manual: present to user for resolution

---

## Error Responses

All endpoints may return errors in this format:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common Errors

- `Token not provided` (401) - Authorization header missing
- `Invalid token` (401) - JWT token is invalid or expired  
- `Validation error` (400) - Request body validation failed
- `Table not allowed` (conflict in push) - Table name not in allowed list
- `Missing required fields` (conflict in push) - Operation missing table/action/data/timestamp

---

## Rate Limiting

There is no specific rate limiting on sync endpoints, but the general auth rate limiter applies (100 requests per 15 minutes per IP).

---

## Transaction Handling

- `/api/sync/push` operations are wrapped in a database transaction
- If any operation in the transaction fails critically, all operations are rolled back
- Validation errors and conflicts do not roll back the transaction - valid operations are still applied

---

## Best Practices

1. **Batch Operations**: Send multiple operations in a single push request for efficiency
2. **Handle Conflicts**: Always check for conflicts in push responses and resolve them
3. **Periodic Pulls**: Poll for changes at reasonable intervals (e.g., every 5-30 seconds)
4. **Store Timestamps**: Always store the timestamp returned from pull for the next sync
5. **Offline Support**: Queue operations while offline and sync when connection is restored
6. **Idempotent Operations**: Design operations to be safely retried if needed

---

## Security Considerations

- All sync operations are user-scoped - users can only sync their own data
- Table names are validated against an allowlist to prevent SQL injection
- JWTs should be stored securely on the desktop app
- Use HTTPS in production to encrypt sync traffic
