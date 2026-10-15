-- Add icon columns to task_groups and taskbases
-- Icons are stored as kebab-case strings (e.g., 'folder-open', 'calendar-event')

ALTER TABLE task_groups
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'folder';

ALTER TABLE taskbases
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'refresh';

-- Indexes for potential icon-based queries
CREATE INDEX IF NOT EXISTS idx_task_groups_icon ON task_groups(icon);
CREATE INDEX IF NOT EXISTS idx_taskbases_icon ON taskbases(icon);

-- Set default values for existing records
UPDATE task_groups SET icon = 'folder' WHERE icon IS NULL;
UPDATE taskbases SET icon = 'refresh' WHERE icon IS NULL;

-- Add comments
COMMENT ON COLUMN task_groups.icon IS 'Tabler icon name (kebab-case)';
COMMENT ON COLUMN taskbases.icon IS 'Tabler icon name (kebab-case)';
