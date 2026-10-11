-- Таблица шаблонов задач для SQLite
CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    default_priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
    default_group_id INTEGER REFERENCES task_groups(id) ON DELETE SET NULL,
    default_group_type_id INTEGER REFERENCES task_group_types(id) ON DELETE SET NULL,
    checklist_items TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Index для быстрого поиска шаблонов по пользователю
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);
