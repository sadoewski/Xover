-- Таблица для связей между документами (гиперссылки)
CREATE TABLE IF NOT EXISTS document_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_document_id INTEGER NOT NULL,
  target_document_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_document_id) REFERENCES rwprint_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (target_document_id) REFERENCES rwprint_documents(id) ON DELETE CASCADE,
  UNIQUE(source_document_id, target_document_id)
);

CREATE INDEX IF NOT EXISTS idx_document_links_source ON document_links(source_document_id);
CREATE INDEX IF NOT EXISTS idx_document_links_target ON document_links(target_document_id);

-- Таблица для связей документов с задачами
CREATE TABLE IF NOT EXISTS document_task_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES rwprint_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(document_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_document_task_links_document ON document_task_links(document_id);
CREATE INDEX IF NOT EXISTS idx_document_task_links_task ON document_task_links(task_id);
