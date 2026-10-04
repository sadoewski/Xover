import pg from 'pg';

// В Docker переменные окружения передаются через docker-compose
// dotenv нужен только для локальной разработки
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hostprint',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('error', (err) => {
  console.error('⚠️  PostgreSQL error:', err.message);
  // Don't exit - allow fallback to SQLite in standalone mode
});

export default pool;
