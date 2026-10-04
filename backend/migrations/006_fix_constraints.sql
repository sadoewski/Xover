-- Fix database constraints
-- Removes incorrect UNIQUE constraint on priorities.name (should be per-user)
-- Adds missing constraints and checks

-- 1. Remove incorrect UNIQUE constraint on priorities.name
-- This constraint prevents different users from having priorities with the same name
ALTER TABLE priorities DROP CONSTRAINT IF EXISTS priorities_name_key;

-- 2. Add CHECK constraints for data validation

-- Priorities: level должен быть положительным
ALTER TABLE priorities
  ADD CONSTRAINT priorities_level_positive CHECK (level > 0);

-- Priorities: color должен быть в hex формате
ALTER TABLE priorities
  ADD CONSTRAINT priorities_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Task groups: color должен быть в hex формате
ALTER TABLE task_groups
  ADD CONSTRAINT task_groups_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Tasks: status должен быть валидным
ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_valid CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'moved'));

-- NOTE: time_slot_start < time_slot_end constraint не добавлен
-- Причина: ночные смены могут иметь start > end (20:30 → 08:30 следующего дня)
-- Валидация должна быть на application level, не в БД

-- Events: month должен быть 1-12
ALTER TABLE events
  ADD CONSTRAINT events_month_valid CHECK (month IS NULL OR (month >= 1 AND month <= 12));

-- Events: day должен быть 1-31
ALTER TABLE events
  ADD CONSTRAINT events_day_valid CHECK (day IS NULL OR (day >= 1 AND day <= 31));

-- Events: тип должен быть валидным (добавлены все используемые типы)
ALTER TABLE events
  ADD CONSTRAINT events_type_valid CHECK (type IN ('meeting', 'deadline', 'reminder', 'holiday', 'birthday', 'anniversary', 'vacation', 'work', 'personal', 'other'));

-- Event year notes: year должен быть разумным
ALTER TABLE event_year_notes
  ADD CONSTRAINT event_year_notes_year_valid CHECK (year >= 2000 AND year <= 2100);

-- 3. Add NOT NULL constraints where appropriate

-- Users: email не должен быть пустой строкой (если указан)
ALTER TABLE users
  ADD CONSTRAINT users_email_not_empty CHECK (email IS NULL OR length(trim(email)) > 0);

-- Priorities: name не должен быть пустым
ALTER TABLE priorities
  ADD CONSTRAINT priorities_name_not_empty CHECK (length(trim(name)) > 0);

-- Task groups: name не должен быть пустым
ALTER TABLE task_groups
  ADD CONSTRAINT task_groups_name_not_empty CHECK (length(trim(name)) > 0);

-- Tasks: title не должен быть пустым
ALTER TABLE tasks
  ADD CONSTRAINT tasks_title_not_empty CHECK (length(trim(title)) > 0);

-- Events: name не должен быть пустым
ALTER TABLE events
  ADD CONSTRAINT events_name_not_empty CHECK (length(trim(name)) > 0);

-- 4. Create index on priorities(name) for performance (non-unique)
-- This helps with searches but doesn't enforce global uniqueness
CREATE INDEX IF NOT EXISTS idx_priorities_name ON priorities(name);

-- 5. Verify foreign key constraints are present
-- (Already defined in previous migrations, this is just documentation)

-- priorities.user_id → users.id ON DELETE CASCADE ✓
-- task_groups.user_id → users.id ON DELETE CASCADE ✓
-- task_group_types.group_id → task_groups.id ON DELETE CASCADE ✓
-- tasks.user_id → users.id ON DELETE CASCADE ✓
-- tasks.group_id → task_groups.id ON DELETE CASCADE ✓
-- tasks.priority_id → priorities.id ON DELETE RESTRICT ✓
-- tasks.group_type_id → task_group_types.id ON DELETE SET NULL ✓
-- task_logs.task_id → tasks.id ON DELETE CASCADE ✓
-- task_logs.user_id → users.id ON DELETE CASCADE ✓
-- events.user_id → users.id ON DELETE CASCADE ✓
-- event_year_notes.event_id → events.id ON DELETE CASCADE ✓
-- event_year_notes.user_id → users.id ON DELETE CASCADE ✓
