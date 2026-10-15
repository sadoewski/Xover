-- Rename datatasks to taskbases
-- This is part of the renaming from datatask to taskbase across the codebase

-- Rename the table (only if datatasks exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'datatasks') THEN
        ALTER TABLE datatasks RENAME TO taskbases;
    END IF;
END $$;

-- Rename the sequence (only if old sequence exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'datatasks_id_seq') THEN
        ALTER SEQUENCE datatasks_id_seq RENAME TO taskbases_id_seq;
    END IF;
END $$;

-- Rename indexes (only if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'datatasks_pkey') THEN
        ALTER INDEX datatasks_pkey RENAME TO taskbases_pkey;
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_datatasks_group') THEN
        ALTER INDEX idx_datatasks_group RENAME TO idx_taskbases_group;
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_datatasks_user') THEN
        ALTER INDEX idx_datatasks_user RENAME TO idx_taskbases_user;
    END IF;
END $$;

-- Rename constraints (only if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'datatasks_name_not_empty') THEN
        ALTER TABLE taskbases RENAME CONSTRAINT datatasks_name_not_empty TO taskbases_name_not_empty;
    END IF;
    IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'datatasks_group_id_fkey') THEN
        ALTER TABLE taskbases RENAME CONSTRAINT datatasks_group_id_fkey TO taskbases_group_id_fkey;
    END IF;
    IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'datatasks_user_id_fkey') THEN
        ALTER TABLE taskbases RENAME CONSTRAINT datatasks_user_id_fkey TO taskbases_user_id_fkey;
    END IF;
END $$;

-- Rename trigger
DROP TRIGGER IF EXISTS update_datatasks_updated_at ON taskbases;
DROP TRIGGER IF EXISTS update_taskbases_updated_at ON taskbases;
CREATE TRIGGER update_taskbases_updated_at
    BEFORE UPDATE ON taskbases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Rename related table datatask_dates to taskbase_dates
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'datatask_dates') THEN
        ALTER TABLE datatask_dates RENAME TO taskbase_dates;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'datatask_dates_id_seq') THEN
        ALTER SEQUENCE datatask_dates_id_seq RENAME TO taskbase_dates_id_seq;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'datatask_dates_pkey') THEN
        ALTER INDEX datatask_dates_pkey RENAME TO taskbase_dates_pkey;
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_datatask_dates_datatask') THEN
        ALTER INDEX idx_datatask_dates_datatask RENAME TO idx_taskbase_dates_taskbase;
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_datatask_dates_date') THEN
        ALTER INDEX idx_datatask_dates_date RENAME TO idx_taskbase_dates_date;
    END IF;
END $$;

-- Rename column datatask_id to taskbase_id in taskbase_dates
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'taskbase_dates'
        AND column_name = 'datatask_id'
    ) THEN
        ALTER TABLE taskbase_dates RENAME COLUMN datatask_id TO taskbase_id;
    END IF;
END $$;

-- Rename constraint
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'datatask_dates_datatask_id_fkey') THEN
        ALTER TABLE taskbase_dates RENAME CONSTRAINT datatask_dates_datatask_id_fkey TO taskbase_dates_taskbase_id_fkey;
    END IF;
END $$;

-- Update foreign key in tasks table
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tasks'
        AND column_name = 'datatask_id'
    ) THEN
        ALTER TABLE tasks RENAME COLUMN datatask_id TO taskbase_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'tasks_datatask_id_fkey') THEN
        ALTER TABLE tasks RENAME CONSTRAINT tasks_datatask_id_fkey TO tasks_taskbase_id_fkey;
    END IF;
END $$;
