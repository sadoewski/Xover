import pool from './src/config/database.js';

console.log('🧪 Тестирование API endpoints\n');

const errors = [];

async function testDatabase() {
  console.log('1️⃣ Проверка подключения к БД...');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('   ✅ БД подключена:', result.rows[0].now);
  } catch (error) {
    const err = `❌ Ошибка подключения к БД: ${error.message}`;
    console.log('   ' + err);
    errors.push(err);
  }
}

async function testTableStructure() {
  console.log('\n2️⃣ Проверка структуры таблиц...');

  const tables = ['users', 'priorities', 'task_groups', 'task_group_types', 'tasks', 'events', 'event_year_notes', 'datatasks', 'datatask_dates'];

  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      if (result.rows.length === 0) {
        const err = `❌ Таблица ${table} не существует`;
        console.log('   ' + err);
        errors.push(err);
      } else {
        console.log(`   ✅ ${table} (${result.rows.length} колонок)`);
      }
    } catch (error) {
      const err = `❌ Ошибка проверки таблицы ${table}: ${error.message}`;
      console.log('   ' + err);
      errors.push(err);
    }
  }
}

async function testRequiredColumns() {
  console.log('\n3️⃣ Проверка критичных колонок...');

  const requiredColumns = {
    events: ['updated_at', 'is_day_off', 'is_yearly', 'month', 'day'],
    event_year_notes: ['user_id', 'updated_at'],
    tasks: ['time_slot_start', 'time_slot_end', 'is_time_bound', 'datatask_id', 'updated_at'],
    datatasks: ['user_id', 'name', 'group_id', 'time_slot_start', 'time_slot_end', 'is_time_bound'],
  };

  for (const [table, columns] of Object.entries(requiredColumns)) {
    try {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
      `, [table]);

      const existingColumns = new Set(result.rows.map(r => r.column_name));

      for (const col of columns) {
        if (existingColumns.has(col)) {
          console.log(`   ✅ ${table}.${col}`);
        } else {
          const err = `❌ ${table}.${col} отсутствует`;
          console.log('   ' + err);
          errors.push(err);
        }
      }
    } catch (error) {
      const err = `❌ Ошибка проверки ${table}: ${error.message}`;
      console.log('   ' + err);
      errors.push(err);
    }
  }
}

async function testUser() {
  console.log('\n4️⃣ Проверка/создание тестового пользователя...');

  try {
    // Проверяем есть ли пользователь test
    let result = await pool.query('SELECT id FROM users WHERE username = $1', ['test']);

    if (result.rows.length === 0) {
      // Создаём тестового пользователя
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.default.hash('test123', 10);

      result = await pool.query(
        'INSERT INTO users (username, password_hash, name, email) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test', passwordHash, 'Test User', 'test@example.com']
      );
      console.log('   ✅ Создан тестовый пользователь (id:', result.rows[0].id + ')');
    } else {
      console.log('   ✅ Тестовый пользователь существует (id:', result.rows[0].id + ')');
    }

    return result.rows[0].id;
  } catch (error) {
    const err = `❌ Ошибка с пользователем: ${error.message}`;
    console.log('   ' + err);
    errors.push(err);
    return null;
  }
}

async function testPriority(userId) {
  console.log('\n5️⃣ Проверка приоритетов...');

  try {
    let result = await pool.query('SELECT id FROM priorities WHERE user_id = $1 LIMIT 1', [userId]);

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO priorities (user_id, name, color, level) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, 'Тест', '#ff0000', 1]
      );
      console.log('   ✅ Создан тестовый приоритет (id:', result.rows[0].id + ')');
    } else {
      console.log('   ✅ Приоритет существует (id:', result.rows[0].id + ')');
    }

    return result.rows[0].id;
  } catch (error) {
    const err = `❌ Ошибка с приоритетом: ${error.message}`;
    console.log('   ' + err);
    errors.push(err);
    return null;
  }
}

async function testGroup(userId) {
  console.log('\n6️⃣ Проверка групп...');

  try {
    let result = await pool.query('SELECT id FROM task_groups WHERE user_id = $1 LIMIT 1', [userId]);

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO task_groups (user_id, name, color) VALUES ($1, $2, $3) RETURNING id',
        [userId, 'Тестовая группа', '#00ff00']
      );
      console.log('   ✅ Создана тестовая группа (id:', result.rows[0].id + ')');
    } else {
      console.log('   ✅ Группа существует (id:', result.rows[0].id + ')');
    }

    return result.rows[0].id;
  } catch (error) {
    const err = `❌ Ошибка с группой: ${error.message}`;
    console.log('   ' + err);
    errors.push(err);
    return null;
  }
}

async function testTaskCreation(userId, groupId, priorityId) {
  console.log('\n7️⃣ Тест создания задачи...');

  try {
    const result = await pool.query(
      `INSERT INTO tasks (
        user_id, group_id, priority_id, title, description, date,
        time_slot_start, time_slot_end, is_time_bound, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, title, time_slot_start, time_slot_end, is_time_bound, updated_at`,
      [userId, groupId, priorityId, 'Тестовая задача', 'Описание', '2026-10-05', '10:00:00', '11:00:00', true, 'pending']
    );

    const task = result.rows[0];
    console.log('   ✅ Задача создана:');
    console.log('      id:', task.id);
    console.log('      title:', task.title);
    console.log('      time_slot_start:', task.time_slot_start);
    console.log('      time_slot_end:', task.time_slot_end);
    console.log('      is_time_bound:', task.is_time_bound);
    console.log('      updated_at:', task.updated_at);

    return task.id;
  } catch (error) {
    const err = `❌ Ошибка создания задачи: ${error.message}`;
    console.log('   ' + err);
    errors.push(err);
    return null;
  }
}

async function testEventCreation(userId) {
  console.log('\n8️⃣ Тест создания события...');

  try {
    const result = await pool.query(
      `INSERT INTO events (
        user_id, type, name, description, month, day, date, is_day_off, is_yearly
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, month, day, is_day_off, is_yearly, updated_at`,
      [userId, 'birthday', 'День рождения', 'Тестовое событие', 10, 5, '2026-10-05', false, true]
    );

    const event = result.rows[0];
    console.log('   ✅ Событие создано:');
    console.log('      id:', event.id);
    console.log('      name:', event.name);
    console.log('      month:', event.month);
    console.log('      day:', event.day);
    console.log('      is_day_off:', event.is_day_off);
    console.log('      is_yearly:', event.is_yearly);
    console.log('      updated_at:', event.updated_at);

    return event.id;
  } catch (error) {
    const err = `❌ Ошибка создания события: ${error.message}`;
    console.log('   ' + err);
    errors.push(err);
    return null;
  }
}

async function testDataTaskCreation(userId, groupId) {
  console.log('\n9️⃣ Тест создания datatask...');

  try {
    const result = await pool.query(
      `INSERT INTO datatasks (
        user_id, name, group_id, time_slot_start, time_slot_end, is_time_bound
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, time_slot_start, time_slot_end, is_time_bound, updated_at`,
      [userId, 'Повторяющаяся задача', groupId, '09:00:00', '10:00:00', true]
    );

    const datatask = result.rows[0];
    console.log('   ✅ DataTask создан:');
    console.log('      id:', datatask.id);
    console.log('      name:', datatask.name);
    console.log('      time_slot_start:', datatask.time_slot_start);
    console.log('      time_slot_end:', datatask.time_slot_end);
    console.log('      is_time_bound:', datatask.is_time_bound);
    console.log('      updated_at:', datatask.updated_at);

    return datatask.id;
  } catch (error) {
    const err = `❌ Ошибка создания datatask: ${error.message}`;
    console.log('   ' + err);
    errors.push(err);
    return null;
  }
}

async function run() {
  try {
    await testDatabase();
    await testTableStructure();
    await testRequiredColumns();

    const userId = await testUser();
    if (!userId) {
      console.log('\n❌ Не удалось получить пользователя, прерываем тесты');
      return;
    }

    const priorityId = await testPriority(userId);
    const groupId = await testGroup(userId);

    if (priorityId && groupId) {
      await testTaskCreation(userId, groupId, priorityId);
      await testEventCreation(userId);
      await testDataTaskCreation(userId, groupId);
    }

    console.log('\n' + '='.repeat(80));

    if (errors.length === 0) {
      console.log('\n✅ ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!');
      console.log('\n🎉 База данных полностью синхронизирована и готова к работе!');
    } else {
      console.log('\n❌ НАЙДЕНЫ ОШИБКИ:', errors.length);
      console.log('\n📋 Список ошибок:');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

  } catch (error) {
    console.error('\n💥 Критическая ошибка:', error);
  } finally {
    await pool.end();
  }
}

run();
