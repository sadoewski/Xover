import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Начинаем миграцию базы данных...');

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );

    await client.query(schemaSQL);

    console.log('✓ Миграция успешно завершена');
  } catch (error) {
    console.error('Ошибка при миграции:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
