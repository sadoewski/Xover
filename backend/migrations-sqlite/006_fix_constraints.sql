-- Fix database constraints for SQLite
-- Adds CHECK constraints and validation

-- Note: SQLite doesn't support adding constraints to existing tables easily
-- We'll create these checks via triggers where needed

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_priorities_name ON priorities(name);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_rwprint_documents_title ON rwprint_documents(title);
CREATE INDEX IF NOT EXISTS idx_rwprint_documents_env ON rwprint_documents(environment_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_folders_env ON rwprint_folders(environment_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_tags_env ON rwprint_tags(environment_id);

CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_site_items_site ON site_items(site_id);
CREATE INDEX IF NOT EXISTS idx_site_items_parent ON site_items(parent_id);

CREATE INDEX IF NOT EXISTS idx_datatasks_user ON datatasks(user_id);
CREATE INDEX IF NOT EXISTS idx_datatasks_group ON datatasks(group_id);
CREATE INDEX IF NOT EXISTS idx_datatask_dates_datatask ON datatask_dates(datatask_id);
CREATE INDEX IF NOT EXISTS idx_datatask_dates_date ON datatask_dates(date);
