import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkStats() {
  try {
    // Проверяем общее количество документов
    const docs = await pool.query('SELECT COUNT(*) FROM rwprint_documents');
    console.log('Всего документов в БД:', docs.rows[0].count);
    
    // Проверяем структуру таблицы
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rwprint_documents'
      ORDER BY ordinal_position
    `);
    console.log('\nСтруктура таблицы rwprint_documents:');
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Проверяем есть ли поля для статистики
    const sample = await pool.query('SELECT id, file_size, word_count, char_count FROM rwprint_documents LIMIT 1');
    console.log('\nПример данных:', sample.rows[0] || 'Нет данных');
    
    await pool.end();
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

checkStats();
