# Database Configuration

## Environment Variables

### PostgreSQL (Default for cloud deployment)
```bash
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostprint
DB_USER=postgres
DB_PASSWORD=your_password
```

### SQLite (Default for embedded/local use)
```bash
DB_TYPE=sqlite
SQLITE_DB_PATH=/path/to/hostprint.db  # Optional, defaults to backend/data/hostprint.db
```

## Usage

### Running migrations
```bash
# PostgreSQL
DB_TYPE=postgresql npm run db:migrate

# SQLite
DB_TYPE=sqlite npm run db:migrate
```

### Starting the server
```bash
# PostgreSQL
DB_TYPE=postgresql npm start

# SQLite  
DB_TYPE=sqlite npm start
```

## Key Differences

### Data Types
- PostgreSQL `SERIAL` → SQLite `INTEGER PRIMARY KEY AUTOINCREMENT`
- PostgreSQL `JSONB` → SQLite `TEXT` (JSON stored as text)
- PostgreSQL `BOOLEAN` → SQLite `INTEGER` (0/1)

### Functions
- PostgreSQL `NOW()` → SQLite `CURRENT_TIMESTAMP`
- PostgreSQL `RETURNING *` → SQLite uses `last_insert_rowid()`

### Triggers
- PostgreSQL: `BEFORE UPDATE` trigger with function
- SQLite: `AFTER UPDATE` trigger with inline UPDATE statement

## Migration Files

- `backend/migrations/` - PostgreSQL migrations
- `backend/migrations-sqlite/` - SQLite migrations

Both sets are kept in sync, with syntax differences for compatibility.
