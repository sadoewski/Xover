import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine database path
const getDbPath = () => {
  if (process.env.SQLITE_DB_PATH) {
    return process.env.SQLITE_DB_PATH;
  }

  // Default to data directory in project root
  const dataDir = join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return join(dataDir, 'hostprint.db');
};

const dbPath = getDbPath();
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// PostgreSQL-compatible wrapper for SQLite
class SQLitePoolWrapper {
  constructor(database) {
    this.db = database;
  }

  // Query method to mimic pg pool.query()
  async query(text, params = []) {
    try {
      // Handle different query types
      const upperText = text.trim().toUpperCase();

      if (upperText.startsWith('SELECT') || upperText.startsWith('WITH')) {
        const stmt = this.db.prepare(text);
        const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
        return { rows, rowCount: rows.length };
      }
      else if (upperText.startsWith('INSERT')) {
        const stmt = this.db.prepare(text);
        const info = params.length > 0 ? stmt.run(...params) : stmt.run();

        // Handle RETURNING clause for INSERT
        if (text.toUpperCase().includes('RETURNING')) {
          // For INSERT ... RETURNING, we need to fetch the inserted row
          const lastId = info.lastInsertRowid;
          const tableName = text.match(/INSERT INTO\s+(\w+)/i)[1];
          const selectStmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
          const rows = [selectStmt.get(lastId)];
          return { rows, rowCount: info.changes };
        }

        return { rows: [], rowCount: info.changes, insertId: info.lastInsertRowid };
      }
      else if (upperText.startsWith('UPDATE') || upperText.startsWith('DELETE')) {
        const stmt = this.db.prepare(text);
        const info = params.length > 0 ? stmt.run(...params) : stmt.run();

        // Handle RETURNING clause
        if (text.toUpperCase().includes('RETURNING')) {
          // Extract WHERE clause to find affected rows
          const whereMatch = text.match(/WHERE\s+(.+?)(?:RETURNING|$)/is);
          if (whereMatch) {
            const tableName = text.match(/(?:UPDATE|DELETE FROM)\s+(\w+)/i)[1];
            const selectStmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE ${whereMatch[1]}`);
            const rows = params.length > 0 ? selectStmt.all(...params) : selectStmt.all();
            return { rows, rowCount: info.changes };
          }
        }

        return { rows: [], rowCount: info.changes };
      }
      else {
        // DDL statements (CREATE, ALTER, DROP, etc.)
        this.db.exec(text);
        return { rows: [], rowCount: 0 };
      }
    } catch (error) {
      throw new Error(`SQLite query error: ${error.message}\nQuery: ${text}`);
    }
  }

  // Transaction support
  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {},
      query: async (text, params) => this.query(text, params)
    };
  }

  // End connection (for graceful shutdown)
  async end() {
    this.db.close();
  }

  // Direct access to better-sqlite3 instance for complex operations
  get instance() {
    return this.db;
  }
}

const pool = new SQLitePoolWrapper(db);

export default pool;
export { db };
