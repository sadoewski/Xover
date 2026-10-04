import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Начинаем миграцию базы данных...\n');

    // Создаем таблицу для отслеживания миграций
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Получаем список уже выполненных миграций
    const executed = await client.query(
      'SELECT migration_name FROM schema_migrations ORDER BY id'
    );
    const executedMigrations = new Set(executed.rows.map(r => r.migration_name));

    console.log(`✓ Найдено ${executedMigrations.size} выполненных миграций\n`);

    // Получаем список всех миграций из папки
    const migrationsDir = path.join(__dirname, 'migrations');
    let migrationFiles = [];

    if (fs.existsSync(migrationsDir)) {
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    }

    // Если нет миграций, выполняем основную схему
    if (migrationFiles.length === 0) {
      console.log('📦 Миграции не найдены, выполняем schema.sql...\n');

      const schemaPath = path.join(__dirname, 'src/db/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        await client.query('BEGIN');
        await client.query(schemaSQL);
        await client.query('COMMIT');

        console.log('✓ schema.sql успешно выполнена\n');
      } else {
        throw new Error('schema.sql не найдена!');
      }
    } else {
      // Выполняем каждую миграцию по очереди
      for (const file of migrationFiles) {
        if (executedMigrations.has(file)) {
          console.log(`⏭️  Пропускаем ${file} (уже выполнена)`);
          continue;
        }

        console.log(`🔄 Выполняем ${file}...`);

        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        try {
          await client.query('BEGIN');
          await client.query(migrationSQL);
          await client.query(
            'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');

          console.log(`✓ ${file} выполнена успешно\n`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Ошибка при выполнении ${file}:`);
          console.error(error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ Все миграции успешно выполнены!');

    // Показываем статистику по таблицам
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n📊 Таблицы в базе данных:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error) {
    console.error('\n❌ Ошибка при миграции:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем миграции
runMigrations().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
