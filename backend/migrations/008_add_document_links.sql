-- Таблица для связей между документами (гиперссылки)
CREATE TABLE IF NOT EXISTS document_links (
  id SERIAL PRIMARY KEY,
  source_document_id INTEGER NOT NULL REFERENCES rwprint_documents(id) ON DELETE CASCADE,
  target_document_id INTEGER NOT NULL REFERENCES rwprint_documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_document_id, target_document_id),
  CHECK (source_document_id != target_document_id)
);

-- Таблица для связей документов с задачами
CREATE TABLE IF NOT EXISTS document_task_links (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES rwprint_documents(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(document_id, task_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_document_links_source ON document_links(source_document_id);
CREATE INDEX IF NOT EXISTS idx_document_links_target ON document_links(target_document_id);
CREATE INDEX IF NOT EXISTS idx_document_task_links_document ON document_task_links(document_id);
CREATE INDEX IF NOT EXISTS idx_document_task_links_task ON document_task_links(task_id);

-- Добавляем запись в таблицу миграций
INSERT INTO schema_migrations (version, filename) VALUES ('008', '008_add_document_links.sql')
ON CONFLICT (version) DO NOTHING;
