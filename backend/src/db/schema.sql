-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица приоритетов
CREATE TABLE IF NOT EXISTS priorities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Таблица групп задач
CREATE TABLE IF NOT EXISTS task_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Таблица видов групп (подкатегории)
CREATE TABLE IF NOT EXISTS task_group_types (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, name)
);

-- Таблица записей (задач)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
    group_type_id INTEGER REFERENCES task_group_types(id) ON DELETE SET NULL,
    priority_id INTEGER NOT NULL REFERENCES priorities(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time_slot_start TIME,
    time_slot_end TIME,
    is_time_bound BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending',
    status_reason TEXT,
    checklist JSONB DEFAULT '[]',
    task_relations JSONB DEFAULT '[]',
    linked_tasks JSONB DEFAULT '[]',
    links JSONB DEFAULT '[]',
    logs JSONB DEFAULT '[]',
    is_free_time BOOLEAN DEFAULT TRUE,
    moved_to_date DATE,
    moved_from_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица логов задач
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

-- Таблица событий
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    month INTEGER,
    day INTEGER,
    date DATE,
    start_time TIME,
    end_time TIME,
    color VARCHAR(7),
    is_day_off BOOLEAN DEFAULT FALSE,
    is_yearly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заметок к событиям по годам
CREATE TABLE IF NOT EXISTS event_year_notes (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, year)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority_id);
CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_relations ON tasks USING GIN (task_relations);
CREATE INDEX IF NOT EXISTS idx_tasks_checklist ON tasks USING GIN (checklist);
CREATE INDEX IF NOT EXISTS idx_tasks_datatask_id ON tasks(datatask_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_month_day ON events(month, day);
CREATE INDEX IF NOT EXISTS idx_events_user_month ON events(user_id, month);
CREATE INDEX IF NOT EXISTS idx_event_notes_event ON event_year_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_year_notes_user ON event_year_notes(user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_year_notes_updated_at ON event_year_notes;

CREATE TRIGGER update_event_year_notes_updated_at
BEFORE UPDATE ON event_year_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
