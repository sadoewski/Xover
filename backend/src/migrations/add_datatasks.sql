-- Создание таблицы datatasks
CREATE TABLE IF NOT EXISTS datatasks (
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

-- Создание таблицы дат для datatasks
CREATE TABLE IF NOT EXISTS datatask_dates (
  id SERIAL PRIMARY KEY,
  datatask_id INTEGER NOT NULL REFERENCES datatasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(datatask_id, date)
);

-- Добавление поля datatask_id в таблицу tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS datatask_id INTEGER REFERENCES datatasks(id) ON DELETE SET NULL;

-- Создание индекса для быстрого поиска задач по datatask_id
CREATE INDEX IF NOT EXISTS idx_tasks_datatask_id ON tasks(datatask_id);

-- Создание индекса для дат datatasks
CREATE INDEX IF NOT EXISTS idx_datatask_dates_datatask_id ON datatask_dates(datatask_id);
CREATE INDEX IF NOT EXISTS idx_datatask_dates_date ON datatask_dates(date);
