-- Таблица логов задач
CREATE TABLE IF NOT EXISTS task_logs (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска логов по задаче
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id, created_at DESC);

-- Добавляем поля для переноса задачи
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS moved_to_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS moved_from_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS linked_tasks JSONB DEFAULT '[]';

-- Функция для автоматического создания лога при создании задачи
CREATE OR REPLACE FUNCTION create_task_creation_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_logs (task_id, user_id, action, details)
  VALUES (NEW.id, NEW.user_id, 'created', 'Задача создана');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического создания лога при создании задачи
DROP TRIGGER IF EXISTS task_creation_log_trigger ON tasks;
CREATE TRIGGER task_creation_log_trigger
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION create_task_creation_log();

-- Функция для логирования изменений задачи
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Логируем изменение статуса
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_logs (task_id, user_id, action, old_value, new_value, details)
    VALUES (NEW.id, NEW.user_id, 'status_changed', OLD.status, NEW.status, NEW.status_reason);
  END IF;

  -- Логируем изменение приоритета
  IF OLD.priority_id IS DISTINCT FROM NEW.priority_id THEN
    INSERT INTO task_logs (task_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, NEW.user_id, 'priority_changed', OLD.priority_id::TEXT, NEW.priority_id::TEXT);
  END IF;

  -- Логируем изменение даты (перенос)
  IF OLD.date IS DISTINCT FROM NEW.date THEN
    INSERT INTO task_logs (task_id, user_id, action, old_value, new_value, details)
    VALUES (NEW.id, NEW.user_id, 'moved', OLD.date::TEXT, NEW.date::TEXT,
            'Задача перенесена с ' || OLD.date || ' на ' || NEW.date);
  END IF;

  -- Логируем изменение названия
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO task_logs (task_id, user_id, action, old_value, new_value, details)
    VALUES (NEW.id, NEW.user_id, 'title_changed', OLD.title, NEW.title, 'Изменено название задачи');
  END IF;

  -- Логируем изменение описания
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO task_logs (task_id, user_id, action, old_value, new_value, details)
    VALUES (NEW.id, NEW.user_id, 'description_changed',
            COALESCE(OLD.description, 'пусто'),
            COALESCE(NEW.description, 'пусто'),
            'Изменено описание задачи');
  END IF;

  -- Логируем изменения чек-листа
  IF OLD.checklist::TEXT IS DISTINCT FROM NEW.checklist::TEXT THEN
    INSERT INTO task_logs (task_id, user_id, action, details)
    VALUES (NEW.id, NEW.user_id, 'checklist_updated',
            'Обновлен чек-лист. Элементов: ' || jsonb_array_length(NEW.checklist));
  END IF;

  -- Логируем изменения связанных задач (линков)
  IF OLD.linked_tasks::TEXT IS DISTINCT FROM NEW.linked_tasks::TEXT THEN
    -- Проверяем добавление
    IF jsonb_array_length(NEW.linked_tasks) > jsonb_array_length(OLD.linked_tasks) THEN
      -- Получаем последний добавленный линк
      DECLARE
        new_link TEXT;
      BEGIN
        new_link := (NEW.linked_tasks->-1->>'text')::TEXT;
        INSERT INTO task_logs (task_id, user_id, action, details, new_value)
        VALUES (NEW.id, NEW.user_id, 'link_added',
                'Добавлен линк: "' || COALESCE(new_link, 'без текста') || '"',
                new_link);
      END;
    -- Проверяем удаление
    ELSIF jsonb_array_length(NEW.linked_tasks) < jsonb_array_length(OLD.linked_tasks) THEN
      INSERT INTO task_logs (task_id, user_id, action, details)
      VALUES (NEW.id, NEW.user_id, 'link_removed',
              'Удален линк. Всего линков: ' || jsonb_array_length(NEW.linked_tasks));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для логирования изменений
DROP TRIGGER IF EXISTS task_changes_log_trigger ON tasks;
CREATE TRIGGER task_changes_log_trigger
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION log_task_changes();
