// Database adapter - detects and returns appropriate database connection
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if PostgreSQL is configured
const isPostgreSQLConfigured = () => {
  return !!(process.env.DATABASE_URL || process.env.DB_HOST);
};

// Detect database type from environment
export const getDatabaseType = () => {
  // Explicit DB_TYPE always wins
  if (process.env.DB_TYPE) {
    return process.env.DB_TYPE;
  }

  // If no PostgreSQL config, default to SQLite for standalone mode
  if (!isPostgreSQLConfigured()) {
    return 'sqlite';
  }

  return 'postgresql';
};

export const getDatabase = async () => {
  const dbType = getDatabaseType();

  if (dbType === 'sqlite') {
    console.log('🔧 Running in standalone mode (SQLite only)');
    const { default: db } = await import('./database-sqlite.js');
    return db;
  } else if (dbType === 'postgresql') {
    try {
      const { default: pool } = await import('./database-postgresql.js');
      // Test connection
      await pool.query('SELECT 1');
      return pool;
    } catch (error) {
      console.warn('⚠️  PostgreSQL unavailable, falling back to SQLite:', error.message);
      console.log('🔧 Running in standalone mode (SQLite only)');
      const { default: db } = await import('./database-sqlite.js');
      return db;
    }
  } else {
    throw new Error(`Unsupported database type: ${dbType}`);
  }
};

// Get migrations directory based on database type
export const getMigrationsDir = () => {
  const dbType = getDatabaseType();
  const baseDir = join(__dirname, '..', '..');

  if (dbType === 'sqlite') {
    return join(baseDir, 'migrations-sqlite');
  } else {
    return join(baseDir, 'migrations');
  }
};
