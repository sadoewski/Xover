-- TaskBases Migration
-- Creates taskbases and taskbase_dates tables, adds taskbase_id to tasks

-- Создание таблицы taskbases
CREATE TABLE IF NOT EXISTS taskbases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  group_id INTEGER NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
  time_slot_start TIME,
  time_slot_end TIME,
  is_time_bound BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы дат для taskbases
CREATE TABLE IF NOT EXISTS taskbase_dates (
  id SERIAL PRIMARY KEY,
  taskbase_id INTEGER NOT NULL REFERENCES taskbases(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(taskbase_id, date)
);

-- Добавление поля taskbase_id в таблицу tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS taskbase_id INTEGER REFERENCES taskbases(id) ON DELETE SET NULL;

-- Создание индекса для быстрого поиска задач по taskbase_id
CREATE INDEX IF NOT EXISTS idx_tasks_taskbase_id ON tasks(taskbase_id);

-- Создание индекса для дат taskbases
CREATE INDEX IF NOT EXISTS idx_taskbase_dates_taskbase_id ON taskbase_dates(taskbase_id);
CREATE INDEX IF NOT EXISTS idx_taskbase_dates_date ON taskbase_dates(date);

-- Триггер для обновления updated_at
DROP TRIGGER IF EXISTS update_taskbases_updated_at ON taskbases;
CREATE TRIGGER update_taskbases_updated_at
BEFORE UPDATE ON taskbases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
