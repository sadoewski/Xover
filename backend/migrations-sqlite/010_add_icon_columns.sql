-- Add icon columns to task_groups and taskbases
ALTER TABLE task_groups ADD COLUMN icon VARCHAR(50) DEFAULT 'folder';
ALTER TABLE taskbases ADD COLUMN icon VARCHAR(50) DEFAULT 'refresh';

-- Indexes for potential icon-based queries
CREATE INDEX IF NOT EXISTS idx_task_groups_icon ON task_groups(icon);
CREATE INDEX IF NOT EXISTS idx_taskbases_icon ON taskbases(icon);

-- Set default values for existing records
UPDATE task_groups SET icon = 'folder' WHERE icon IS NULL;
UPDATE taskbases SET icon = 'refresh' WHERE icon IS NULL;
