-- Таблица событий (дни рождения и праздники)
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('birthday', 'holiday')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL, -- День и месяц (год может быть любой, но для хранения используется)
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  is_day_off BOOLEAN DEFAULT FALSE, -- Только для праздников
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица описаний событий для конкретного года
-- Используется для хранения уникальных описаний к событию в конкретном году
CREATE TABLE IF NOT EXISTS event_year_notes (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, year)
);

-- Индексы для быстрого поиска событий по дате
CREATE INDEX IF NOT EXISTS idx_events_user_month_day ON events(user_id, month, day);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_event_year_notes_event_year ON event_year_notes(event_id, year);

-- Триггер для обновления updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_year_notes_updated_at BEFORE UPDATE ON event_year_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
