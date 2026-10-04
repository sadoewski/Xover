import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/database.js';

// Debug: выводим переменные окружения
console.log('🔍 DB Connection Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '***' : undefined
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Создает таблицу schema_migrations если её нет
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      filename VARCHAR(500) NOT NULL
    );
  `);
}

/**
 * Получает список уже примененных миграций
 */
async function getAppliedMigrations(client) {
  try {
    const result = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    return result.rows.map(row => row.version);
  } catch (error) {
    // Если таблицы нет, возвращаем пустой массив
    if (error.code === '42P01' || error.code === '42703') {
      return [];
    }
    throw error;
  }
}

/**
 * Получает список всех файлов миграций
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('⚠️  Директория migrations не найдена');
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(filename => {
    const version = filename.replace('.sql', '');
    return { version, filename, path: path.join(MIGRATIONS_DIR, filename) };
  });
}

/**
 * Применяет одну миграцию
 */
async function applyMigration(client, migration) {
  console.log(`Применяю миграцию: ${migration.filename}`);

  const sql = fs.readFileSync(migration.path, 'utf8');

  try {
    // Пытаемся выполнить миграцию в транзакции
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (version, filename) VALUES ($1, $2)',
      [migration.version, migration.filename]
    );
    await client.query('COMMIT');

    console.log(`✓ Миграция ${migration.filename} успешно применена`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Ошибка при применении миграции ${migration.filename}:`);
    console.error(error.message);
    throw error;
  }
}

/**
 * Основная функция миграции
 */
async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔄 Начинаем миграцию базы данных...\n');

    // Создаем таблицу миграций если её нет
    await ensureMigrationsTable(client);

    // Получаем список примененных миграций
    const applied = await getAppliedMigrations(client);
    console.log(`Применено миграций: ${applied.length}`);
    if (applied.length > 0) {
      console.log(`Последняя: ${applied[applied.length - 1]}\n`);
    }

    // Получаем список всех миграций
    const allMigrations = getMigrationFiles();
    console.log(`Найдено файлов миграций: ${allMigrations.length}\n`);

    // Находим неприменённые миграции
    const pending = allMigrations.filter(m => !applied.includes(m.version));

    if (pending.length === 0) {
      console.log('✓ Все миграции уже применены. База данных актуальна.\n');
      return;
    }

    console.log(`Будет применено миграций: ${pending.length}\n`);

    // Применяем миграции по порядку
    for (const migration of pending) {
      await applyMigration(client, migration);
    }

    console.log('\n✓ Миграция завершена успешно!');

    // Показываем финальный статус
    const finalApplied = await getAppliedMigrations(client);
    console.log(`\nВсего применено миграций: ${finalApplied.length}`);

  } catch (error) {
    console.error('\n✗ Миграция завершилась с ошибкой');
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем миграцию
migrate();
