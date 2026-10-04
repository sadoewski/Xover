-- Комплексная миграция для полной синхронизации базы данных
-- Дата: 2026-10-04
-- Описание: Добавляет все недостающие колонки и индексы

-- ============================================
-- 1. Таблица users
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- 2. Таблица priorities
-- ============================================
ALTER TABLE priorities ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE priorities ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE priorities ADD COLUMN IF NOT EXISTS color VARCHAR(7) NOT NULL DEFAULT '#000000';
ALTER TABLE priorities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE priorities ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE priorities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Добавляем foreign key для user_id если его нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'priorities_user_id_fkey'
    ) THEN
        ALTER TABLE priorities ADD CONSTRAINT priorities_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 3. Таблица task_groups
-- ============================================
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS color VARCHAR(7) NOT NULL DEFAULT '#000000';
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Добавляем foreign key для user_id если его нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'task_groups_user_id_fkey'
    ) THEN
        ALTER TABLE task_groups ADD CONSTRAINT task_groups_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 4. Таблица task_group_types
-- ============================================
ALTER TABLE task_group_types ADD COLUMN IF NOT EXISTS group_id INTEGER;
ALTER TABLE task_group_types ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE task_group_types ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE task_group_types ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Добавляем foreign key для group_id если его нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'task_group_types_group_id_fkey'
    ) THEN
        ALTER TABLE task_group_types ADD CONSTRAINT task_group_types_group_id_fkey
        FOREIGN KEY (group_id) REFERENCES task_groups(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 5. Таблица tasks
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_type_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_slot_start TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_slot_end TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_time_bound BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_relations JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS linked_tasks JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_free_time BOOLEAN DEFAULT TRUE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS moved_to_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS moved_from_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS datatask_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- 6. Таблица events
-- ============================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'other';
ALTER TABLE events ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS month INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS day INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE events ADD COLUMN IF NOT EXISTS color VARCHAR(7);
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_day_off BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_yearly BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Обновляем updated_at для существующих записей
UPDATE events SET updated_at = created_at WHERE updated_at IS NULL;

-- ============================================
-- 7. Таблица event_year_notes
-- ============================================
ALTER TABLE event_year_notes ADD COLUMN IF NOT EXISTS event_id INTEGER;
ALTER TABLE event_year_notes ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE event_year_notes ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE event_year_notes ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE event_year_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE event_year_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Заполняем user_id из связанных событий
UPDATE event_year_notes eyn
SET user_id = e.user_id
FROM events e
WHERE eyn.event_id = e.id AND eyn.user_id IS NULL;

-- ============================================
-- 8. Таблица task_logs
-- ============================================
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. Таблица datatasks
-- ============================================
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

-- ============================================
-- 10. Таблица datatask_dates
-- ============================================
CREATE TABLE IF NOT EXISTS datatask_dates (
    id SERIAL PRIMARY KEY,
    datatask_id INTEGER NOT NULL REFERENCES datatasks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(datatask_id, date)
);

-- ============================================
-- ИНДЕКСЫ
-- ============================================

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority_id);
CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_datatask_id ON tasks(datatask_id);
CREATE INDEX IF NOT EXISTS idx_tasks_relations ON tasks USING GIN (task_relations);
CREATE INDEX IF NOT EXISTS idx_tasks_checklist ON tasks USING GIN (checklist);

-- Task Logs
CREATE INDEX IF NOT EXISTS idx_task_logs_task ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_user ON task_logs(user_id);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_month_day ON events(month, day);
CREATE INDEX IF NOT EXISTS idx_events_user_month ON events(user_id, month);

-- Event Year Notes
CREATE INDEX IF NOT EXISTS idx_event_notes_event ON event_year_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_year_notes_user ON event_year_notes(user_id);

-- Datatasks
CREATE INDEX IF NOT EXISTS idx_datatasks_user ON datatasks(user_id);
CREATE INDEX IF NOT EXISTS idx_datatasks_group ON datatasks(group_id);

-- Datatask Dates
CREATE INDEX IF NOT EXISTS idx_datatask_dates_datatask_id ON datatask_dates(datatask_id);
CREATE INDEX IF NOT EXISTS idx_datatask_dates_date ON datatask_dates(date);

-- ============================================
-- ТРИГГЕРЫ для updated_at
-- ============================================

-- Создаем функцию если её нет
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Events
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Event Year Notes
DROP TRIGGER IF EXISTS update_event_year_notes_updated_at ON event_year_notes;
CREATE TRIGGER update_event_year_notes_updated_at
BEFORE UPDATE ON event_year_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Datatasks
DROP TRIGGER IF EXISTS update_datatasks_updated_at ON datatasks;
CREATE TRIGGER update_datatasks_updated_at
BEFORE UPDATE ON datatasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
