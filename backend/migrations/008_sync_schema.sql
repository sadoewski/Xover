-- Миграция для синхронизации схемы базы данных с кодом
-- Дата: 2026-10-04

-- Добавляем updated_at в таблицу events
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Создаем триггер для автоматического обновления updated_at в events
DROP TRIGGER IF EXISTS update_events_updated_at ON events;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Добавляем user_id в таблицу event_year_notes (если его нет)
ALTER TABLE event_year_notes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Обновляем существующие записи в event_year_notes, устанавливая user_id из связанного события
UPDATE event_year_notes eyn
SET user_id = e.user_id
FROM events e
WHERE eyn.event_id = e.id AND eyn.user_id IS NULL;

-- Добавляем datatask_id в таблицу tasks (если его нет)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS datatask_id INTEGER REFERENCES datatasks(id) ON DELETE SET NULL;

-- Создаем индекс для datatask_id
CREATE INDEX IF NOT EXISTS idx_tasks_datatask_id ON tasks(datatask_id);

-- Убеждаемся что все необходимые колонки существуют в tasks
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

-- Проверяем наличие всех необходимых колонок в events
ALTER TABLE events ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'other';
ALTER TABLE events ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS month INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS day INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_day_off BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_yearly BOOLEAN DEFAULT FALSE;

-- Добавляем индексы если их нет
CREATE INDEX IF NOT EXISTS idx_events_month_day ON events(month, day);
CREATE INDEX IF NOT EXISTS idx_events_user_month ON events(user_id, month);
CREATE INDEX IF NOT EXISTS idx_event_year_notes_user ON event_year_notes(user_id);

-- Обновляем схему для корректной работы с updated_at
UPDATE events SET updated_at = created_at WHERE updated_at IS NULL;
