import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Собираем все req.body поля из контроллеров
const controllersDir = path.join(__dirname, 'src/controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

const requiredFields = {
  tasks: new Set(),
  events: new Set(),
  event_year_notes: new Set(),
  priorities: new Set(),
  task_groups: new Set(),
  task_group_types: new Set(),
  datatasks: new Set(),
  datatask_dates: new Set(),
};

// Маппинг camelCase -> snake_case
const fieldMapping = {
  // Tasks
  groupId: 'group_id',
  groupTypeId: 'group_type_id',
  priorityId: 'priority_id',
  timeSlotStart: 'time_slot_start',
  timeSlotEnd: 'time_slot_end',
  isTimeBound: 'is_time_bound',
  isFreeTime: 'is_free_time',
  statusReason: 'status_reason',
  taskRelations: 'task_relations',
  linkedTasks: 'linked_tasks',
  movedToDate: 'moved_to_date',
  movedFromDate: 'moved_from_date',
  datataskId: 'datatask_id',
  
  // Events
  isDayOff: 'is_day_off',
  isYearly: 'is_yearly',
  startTime: 'start_time',
  endTime: 'end_time',
  
  // Common
  userId: 'user_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  eventId: 'event_id',
};

// Анализируем контроллеры
files.forEach(file => {
  const content = fs.readFileSync(path.join(controllersDir, file), 'utf8');
  
  // Находим все req.body деструктуризации
  const bodyMatches = content.matchAll(/const\s*\{([^}]+)\}\s*=\s*req\.body/g);
  
  for (const match of bodyMatches) {
    const fields = match[1].split(',').map(v => v.trim());
    
    // Определяем таблицу по имени файла
    let table = null;
    if (file.includes('tasks')) table = 'tasks';
    else if (file.includes('events')) table = 'events';
    else if (file.includes('priorities')) table = 'priorities';
    else if (file.includes('groups')) table = 'task_groups';
    else if (file.includes('datatasks')) table = 'datatasks';
    
    if (table && requiredFields[table]) {
      fields.forEach(field => {
        // Конвертируем в snake_case если есть маппинг
        const snakeField = fieldMapping[field] || field;
        if (snakeField && snakeField !== 'null' && snakeField !== 'undefined') {
          requiredFields[table].add(snakeField);
        }
      });
    }
  }
});

// Проверяем что все поля есть в базе
async function verifySchema() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Проверка соответствия схемы базы данных и кода\n');
    console.log('='.repeat(80));
    
    for (const [table, fields] of Object.entries(requiredFields)) {
      if (fields.size === 0) continue;
      
      console.log(`\n📊 Таблица: ${table}`);
      console.log('-'.repeat(80));
      
      // Получаем колонки таблицы
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      const dbColumns = new Set(result.rows.map(r => r.column_name));
      
      console.log(`\nКолонки в базе данных (${dbColumns.size}):`);
      result.rows.forEach(col => {
        console.log(`  ✓ ${col.column_name.padEnd(30)} ${col.data_type}`);
      });
      
      console.log(`\nПоля используемые в коде (${fields.size}):`);
      let missingCount = 0;
      [...fields].sort().forEach(field => {
        if (dbColumns.has(field)) {
          console.log(`  ✓ ${field}`);
        } else {
          console.log(`  ❌ ${field} - ОТСУТСТВУЕТ В БД!`);
          missingCount++;
        }
      });
      
      if (missingCount > 0) {
        console.log(`\n⚠️  ВНИМАНИЕ: ${missingCount} полей отсутствуют в таблице ${table}!`);
      } else {
        console.log(`\n✅ Все поля присутствуют в таблице ${table}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifySchema();
