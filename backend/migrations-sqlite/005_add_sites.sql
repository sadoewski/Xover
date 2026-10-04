-- Sites Schema Migration for SQLite
-- Creates sites and site_items tables

-- Таблица сайтов
CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT 'folder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица элементов сайта
CREATE TABLE IF NOT EXISTS site_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES site_items(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    data TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (type IN ('folder', 'database', 'textboard', 'document'))
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_site_items_site_id ON site_items(site_id);
CREATE INDEX IF NOT EXISTS idx_site_items_parent_id ON site_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_site_items_type ON site_items(type);

-- Триггеры
CREATE TRIGGER IF NOT EXISTS sites_updated_at
AFTER UPDATE ON sites
FOR EACH ROW
BEGIN
    UPDATE sites SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS site_items_updated_at
AFTER UPDATE ON site_items
FOR EACH ROW
BEGIN
    UPDATE site_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
