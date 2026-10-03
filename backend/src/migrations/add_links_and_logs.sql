-- Добавляем поле links для комментариев к задачам
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';

-- Добавляем поле logs для истории изменений задач
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]';

-- Добавляем поле is_free_time для хостборда (вместо is_time_bound)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_free_time BOOLEAN DEFAULT TRUE;
