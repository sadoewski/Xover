-- Добавление поля для связей между задачами
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_relations JSONB DEFAULT '[]';

-- Индекс для быстрого поиска связей
CREATE INDEX IF NOT EXISTS idx_tasks_relations ON tasks USING GIN (task_relations);
