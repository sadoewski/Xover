-- Sites Schema Migration
-- Creates sites and site_items tables

-- Таблица сайтов
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT 'folder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица элементов сайта
CREATE TABLE IF NOT EXISTS site_items (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES site_items(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'folder', 'database', 'textboard', 'document'
    name VARCHAR(255) NOT NULL,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1, -- Размер в grid единицах
    height INTEGER DEFAULT 1,
    data JSONB DEFAULT '{}', -- Содержимое элемента
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_type CHECK (type IN ('folder', 'database', 'textboard', 'document'))
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_site_items_site_id ON site_items(site_id);
CREATE INDEX IF NOT EXISTS idx_site_items_parent_id ON site_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_site_items_type ON site_items(type);

-- Функция обновления updated_at для sites
CREATE OR REPLACE FUNCTION update_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
DROP TRIGGER IF EXISTS sites_updated_at ON sites;
CREATE TRIGGER sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_sites_updated_at();

DROP TRIGGER IF EXISTS site_items_updated_at ON site_items;
CREATE TRIGGER site_items_updated_at
    BEFORE UPDATE ON site_items
    FOR EACH ROW
    EXECUTE FUNCTION update_sites_updated_at();
