-- Add additional constraints for SQLite
-- Note: SQLite has limited ALTER TABLE support for constraints
-- Most validation should be handled at application level

-- Create additional indexes for search and performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_date_status ON tasks(date, status);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_yearly ON events(is_yearly);
CREATE INDEX IF NOT EXISTS idx_rwprint_documents_format ON rwprint_documents(format);
CREATE INDEX IF NOT EXISTS idx_site_items_type_site ON site_items(type, site_id);
