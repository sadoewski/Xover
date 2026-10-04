-- Add additional constraints for RWPrint and Sites modules
-- Adds CHECK constraints and validates data integrity

-- 1. RWPrint: Environment names не должны быть пустыми
ALTER TABLE rwprint_environments
  ADD CONSTRAINT rwprint_environments_name_not_empty CHECK (length(trim(name)) > 0);

-- 2. RWPrint: Folder names не должны быть пустыми
ALTER TABLE rwprint_folders
  ADD CONSTRAINT rwprint_folders_name_not_empty CHECK (length(trim(name)) > 0);

-- 3. RWPrint: Document title не должен быть пустым
ALTER TABLE rwprint_documents
  ADD CONSTRAINT rwprint_documents_title_not_empty CHECK (length(trim(title)) > 0);

-- 4. RWPrint: Document file_size должен быть положительным (если указан)
ALTER TABLE rwprint_documents
  ADD CONSTRAINT rwprint_documents_file_size_positive CHECK (file_size IS NULL OR file_size >= 0);

-- 5. RWPrint: Tag names не должны быть пустыми
ALTER TABLE rwprint_tags
  ADD CONSTRAINT rwprint_tags_name_not_empty CHECK (length(trim(name)) > 0);

-- 6. RWPrint: Tag colors должны быть в hex формате (если указаны)
ALTER TABLE rwprint_tags
  ADD CONSTRAINT rwprint_tags_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');

-- 7. Sites: Site names не должны быть пустыми
ALTER TABLE sites
  ADD CONSTRAINT sites_name_not_empty CHECK (length(trim(name)) > 0);

-- 8. Sites: Site item names не должны быть пустыми
ALTER TABLE site_items
  ADD CONSTRAINT site_items_name_not_empty CHECK (length(trim(name)) > 0);

-- 9. Sites: позиции и размеры должны быть неотрицательными
ALTER TABLE site_items
  ADD CONSTRAINT site_items_position_x_valid CHECK (position_x >= 0),
  ADD CONSTRAINT site_items_position_y_valid CHECK (position_y >= 0),
  ADD CONSTRAINT site_items_width_valid CHECK (width > 0),
  ADD CONSTRAINT site_items_height_valid CHECK (height > 0);

-- 10. DataTasks: names не должны быть пустыми
ALTER TABLE datatasks
  ADD CONSTRAINT datatasks_name_not_empty CHECK (length(trim(name)) > 0);

-- 11. DataTask dates: status должен быть валидным
ALTER TABLE datatask_dates
  ADD CONSTRAINT datatask_dates_status_valid CHECK (status IN ('pending', 'completed', 'skipped'));

-- 12. Event year notes: note не должна быть пустой
ALTER TABLE event_year_notes
  ADD CONSTRAINT event_year_notes_note_not_empty CHECK (length(trim(note)) > 0);

-- 13. Task group types: name не должен быть пустым
ALTER TABLE task_group_types
  ADD CONSTRAINT task_group_types_name_not_empty CHECK (length(trim(name)) > 0);

-- 14. Удаляем дублирующий constraint в events (если существует старый)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;

-- 15. Создаем индексы для производительности

-- RWPrint search indexes
CREATE INDEX IF NOT EXISTS idx_rwprint_documents_title ON rwprint_documents(title);
CREATE INDEX IF NOT EXISTS idx_rwprint_documents_env ON rwprint_documents(environment_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_folders_env ON rwprint_folders(environment_id);
CREATE INDEX IF NOT EXISTS idx_rwprint_tags_env ON rwprint_tags(environment_id);

-- Sites search indexes
CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_site_items_site ON site_items(site_id);
CREATE INDEX IF NOT EXISTS idx_site_items_parent ON site_items(parent_id);

-- DataTasks indexes
CREATE INDEX IF NOT EXISTS idx_datatasks_user ON datatasks(user_id);
CREATE INDEX IF NOT EXISTS idx_datatasks_group ON datatasks(group_id);
CREATE INDEX IF NOT EXISTS idx_datatask_dates_datatask ON datatask_dates(datatask_id);
CREATE INDEX IF NOT EXISTS idx_datatask_dates_date ON datatask_dates(date);
