-- RW:Print Schema Migration

-- Окружения (environments)
CREATE TABLE IF NOT EXISTS rwprint_environments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Папки (folders)
CREATE TABLE IF NOT EXISTS rwprint_folders (
    id SERIAL PRIMARY KEY,
    environment_id INTEGER NOT NULL REFERENCES rwprint_environments(id) ON DELETE CASCADE,
    parent_folder_id INTEGER REFERENCES rwprint_folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Документы (documents)
CREATE TABLE IF NOT EXISTS rwprint_documents (
    id SERIAL PRIMARY KEY,
    environment_id INTEGER NOT NULL REFERENCES rwprint_environments(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES rwprint_folders(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    format VARCHAR(10) DEFAULT 'md', -- md, txt, html
    font_family VARCHAR(100),
    font_size INTEGER,
    is_password_protected BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    word_count INTEGER DEFAULT 0,
    char_count INTEGER DEFAULT 0,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Теги (tags)
CREATE TABLE IF NOT EXISTS rwprint_tags (
    id SERIAL PRIMARY KEY,
    environment_id INTEGER NOT NULL REFERENCES rwprint_environments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(environment_id, name)
);

-- Связь документов и тегов
CREATE TABLE IF NOT EXISTS rwprint_document_tags (
    document_id INTEGER NOT NULL REFERENCES rwprint_documents(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES rwprint_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

-- Метаданные документов
CREATE TABLE IF NOT EXISTS rwprint_document_metadata (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES rwprint_documents(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, key)
);

-- Сайты (sites)
CREATE TABLE IF NOT EXISTS rwprint_sites (
    id SERIAL PRIMARY KEY,
    environment_id INTEGER NOT NULL REFERENCES rwprint_environments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    home_document_id INTEGER REFERENCES rwprint_documents(id) ON DELETE SET NULL,
    theme_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Структура сайта (связь документов в сайт)
CREATE TABLE IF NOT EXISTS rwprint_site_pages (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES rwprint_sites(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES rwprint_documents(id) ON DELETE CASCADE,
    parent_page_id INTEGER REFERENCES rwprint_site_pages(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, document_id)
);

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_rwprint_folders_environment ON rwprint_folders(environment_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_folders_parent ON rwprint_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_documents_environment ON rwprint_documents(environment_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_documents_folder ON rwprint_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_documents_bookmarked ON rwprint_documents(is_bookmarked);
CREATE INDEX IF NOT EXISTS idx_rwprint_tags_environment ON rwprint_tags(environment_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_sites_environment ON rwprint_sites(environment_id);
