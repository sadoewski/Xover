import { useState, useEffect } from 'react';
import { eventsService } from '../services/api';
import { format, getDaysInMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import ProfessionalLayout from '../components/ProfessionalLayout';
import { Plus, ArrowLeft, Trash2, FileText } from 'lucide-react';
import './EventsPage.css';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null); // Новое состояние для выбранного месяца
  const [dayEvents, setDayEvents] = useState([]);
  const [monthEvents, setMonthEvents] = useState([]); // События месяца
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventNotes, setEventNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [newEvent, setNewEvent] = useState({
    type: 'birthday',
    name: '',
    description: '',
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    date: format(new Date(), 'yyyy-MM-dd'),
    isDayOff: false,
    isYearly: true, // По умолчанию ежегодное событие
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsService.getEvents();
      setEvents(data.events);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
    setSelectedDate(null);
    const filtered = events.filter(e => e.month === month);
    setMonthEvents(filtered);
  };

  const handleDayClick = async (month, day) => {
    setSelectedDate({ month, day });
    setSelectedMonth(null);
    try {
      const data = await eventsService.getEventsByDate(month, day);
      setDayEvents(data.events);
    } catch (error) {
      console.error('Ошибка загрузки событий дня:', error);
    }
  };

  const handleCreateEventForMonth = () => {
    setNewEvent({
      ...newEvent,
      month: selectedMonth || new Date().getMonth() + 1,
    });
    setShowCreateModal(true);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      // Подготовка данных в зависимости от типа события
      const eventData = {
        type: newEvent.type,
        name: newEvent.name,
        description: newEvent.description,
        isDayOff: newEvent.isDayOff,
        isYearly: newEvent.isYearly,
      };

      if (newEvent.isYearly) {
        // Для ежегодного события отправляем month и day
        eventData.month = newEvent.month;
        eventData.day = newEvent.day;
      } else {
        // Для разового события отправляем полную дату
        eventData.date = newEvent.date;
      }

      await eventsService.createEvent(eventData);
      setNewEvent({
        type: 'birthday',
        name: '',
        description: '',
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        date: format(new Date(), 'yyyy-MM-dd'),
        isDayOff: false,
        isYearly: true,
      });
      setShowCreateModal(false);
      loadEvents();
      // Обновить список событий месяца, если открыт месяц
      if (selectedMonth) {
        const filtered = events.filter(e => e.month === selectedMonth);
        setMonthEvents(filtered);
      }
    } catch (error) {
      console.error('Ошибка создания события:', error);
      alert('Ошибка создания события');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Удалить событие?')) return;
    try {
      await eventsService.deleteEvent(id);
      await loadEvents();
      if (selectedDate) {
        const data = await eventsService.getEventsByDate(selectedDate.month, selectedDate.day);
        setDayEvents(data.events);
      }
      if (selectedMonth) {
        const filtered = events.filter(e => e.month === selectedMonth && e.id !== id);
        setMonthEvents(filtered);
      }
    } catch (error) {
      console.error('Ошибка удаления события:', error);
    }
  };

  const handleOpenNotes = async (event) => {
    setSelectedEvent(event);
    setShowNotesModal(true);
    try {
      const data = await eventsService.getEventYearNotes(event.id);
      setEventNotes(data.notes);
    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    try {
      await eventsService.upsertEventYearNote(selectedEvent.id, selectedYear, newNote);
      const data = await eventsService.getEventYearNotes(selectedEvent.id);
      setEventNotes(data.notes);
      setNewNote('');
    } catch (error) {
      console.error('Ошибка сохранения заметки:', error);
    }
  };

  const getEventsCountForDay = (month, day) => {
    return events.filter(e => e.month === month && e.day === day).length;
  };

  const getBirthdaysCount = (month, day) => {
    return events.filter(e => e.month === month && e.day === day && e.type === 'birthday').length;
  };

  const getHolidaysCount = (month, day) => {
    return events.filter(e => e.month === month && e.day === day && e.type === 'holiday').length;
  };

  const isDayOff = (month, day) => {
    return events.some(e => e.month === month && e.day === day && e.is_day_off);
  };

  return (
    <ProfessionalLayout>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">События {selectedYear}</h1>
          <button
            onClick={() => {
              if (selectedMonth) {
                handleCreateEventForMonth();
              } else {
                setShowCreateModal(true);
              }
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            {selectedMonth ? `Добавить событие в ${MONTHS[selectedMonth - 1]}` : 'Добавить событие'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
            <div className="spinner"></div>
          </div>
        ) : selectedMonth ? (
          // Отображение событий месяца
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => {
                  setSelectedMonth(null);
                  setMonthEvents([]);
                }}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} />
                Назад к календарю
              </button>
              <h2 className="card-title-text">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </h2>
            </div>

            <div className="card">
              {monthEvents.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                  Нет событий в этом месяце
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {monthEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span className="event-badge birthday">
                              {event.day} {MONTHS[event.month - 1]}
                            </span>
                            <span className={`event-badge ${event.type === 'birthday' ? 'birthday' : 'holiday'}`}>
                              {event.type === 'birthday' ? 'День рождения' : 'Праздник'}
                            </span>
                            {event.is_day_off && (
                              <span className="event-badge day-off">
                                Выходной
                              </span>
                            )}
                          </div>
                          <h3 className="item-title">
                            {event.name}
                          </h3>
                          {event.description && (
                            <p className="item-description">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                          <button
                            onClick={() => handleOpenNotes(event)}
                            className="btn-icon"
                            title="Заметки"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="btn-icon"
                            style={{ color: 'var(--error)' }}
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : selectedDate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setDayEvents([]);
                }}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} />
                Назад к календарю
              </button>
              <h2 className="card-title-text">
                {selectedDate.day} {MONTHS[selectedDate.month - 1]}
              </h2>
            </div>

            <div className="card">
              {dayEvents.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                  Нет событий в этот день
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span className="event-badge birthday">
                              День рождения
                            </span>
                            {event.type !== 'birthday' && (
                              <span className="event-badge holiday">
                                Праздник
                              </span>
                            )}
                            {event.is_day_off && (
                              <span className="event-badge day-off">
                                Выходной
                              </span>
                            )}
                          </div>
                          <h3 className="item-title">
                            {event.name}
                          </h3>
                          {event.description && (
                            <p className="item-description">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                          <button
                            onClick={() => handleOpenNotes(event)}
                            className="btn-icon"
                            title="Заметки"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="btn-icon"
                            style={{ color: 'var(--error)' }}
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {MONTHS.map((monthName, monthIndex) => {
              const month = monthIndex + 1;
              const daysInMonth = getDaysInMonth(new Date(selectedYear, monthIndex));

              return (
                <div key={month} className="card">
                  <h2
                    className="card-title"
                    style={{
                      marginBottom: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => handleMonthClick(month)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                  >
                    {monthName}
                    {events.filter(e => e.month === month).length > 0 && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        background: 'var(--accent-bg)',
                        padding: '2px 8px',
                        borderRadius: '999px'
                      }}>
                        {events.filter(e => e.month === month).length}
                      </span>
                    )}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const eventsCount = getEventsCountForDay(month, day);
                      const birthdaysCount = getBirthdaysCount(month, day);
                      const holidaysCount = getHolidaysCount(month, day);
                      const isWeekend = isDayOff(month, day);

                      return (
                        <button
                          key={day}
                          onClick={() => eventsCount > 0 && handleDayClick(month, day)}
                          style={{
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '12px',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            background: isWeekend ? '#fef2f2' : eventsCount > 0 ? 'var(--accent-bg)' : 'transparent',
                            color: eventsCount > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            cursor: eventsCount > 0 ? 'pointer' : 'default',
                            border: '1px solid',
                            borderColor: isWeekend ? '#dc2626' : eventsCount > 0 ? 'var(--accent-primary)' : 'transparent',
                            fontWeight: eventsCount > 0 || isWeekend ? 500 : 400
                          }}
                          disabled={eventsCount === 0}
                          onMouseEnter={(e) => {
                            if (eventsCount > 0) {
                              e.currentTarget.style.background = 'var(--accent-primary)';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (eventsCount > 0) {
                              e.currentTarget.style.background = 'var(--accent-bg)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }
                          }}
                        >
                          <div>{day}</div>
                          {eventsCount > 0 && (
                            <div style={{ fontSize: '9px', marginTop: '2px', display: 'flex', gap: '3px', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
                              {birthdaysCount > 0 && <span style={{ color: 'var(--color-string)' }}>B:{birthdaysCount}</span>}
                              {holidaysCount > 0 && <span style={{ color: 'var(--color-keyword)' }}>H:{holidaysCount}</span>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модальное окно создания события */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '6px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            margin: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Добавить событие
            </h2>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Тип события
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="input"
                  required
                >
                  <option value="birthday">День рождения</option>
                  <option value="holiday">Праздник</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Название
                </label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="input"
                  placeholder="Имя человека или название праздника"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Описание
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="textarea"
                  rows="3"
                  placeholder="Дополнительная информация"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="isYearly"
                  checked={!newEvent.isYearly}
                  onChange={(e) => setNewEvent({ ...newEvent, isYearly: !e.target.checked })}
                  className="checkbox"
                />
                <label htmlFor="isYearly" style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  Разовое событие (только один раз)
                </label>
              </div>

              {newEvent.isYearly ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Месяц
                    </label>
                    <select
                      value={newEvent.month}
                      onChange={(e) => setNewEvent({ ...newEvent, month: parseInt(e.target.value) })}
                      className="input"
                      required
                    >
                      {MONTHS.map((month, index) => (
                        <option key={index + 1} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      День
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={newEvent.day}
                      onChange={(e) => setNewEvent({ ...newEvent, day: parseInt(e.target.value) })}
                      className="input"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Дата
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              )}

              {newEvent.type === 'holiday' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="isDayOff"
                    checked={newEvent.isDayOff}
                    onChange={(e) => setNewEvent({ ...newEvent, isDayOff: e.target.checked })}
                    className="checkbox"
                  />
                  <label htmlFor="isDayOff" style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                    Выходной день
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно заметок к событию */}
      {showNotesModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '6px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            margin: '16px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Заметки: {selectedEvent.name}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Заметка для {selectedYear} года
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="textarea"
                rows="3"
                placeholder="Введите заметку для этого года..."
              />
              <button
                onClick={handleSaveNote}
                className="btn btn-primary"
                disabled={!newNote.trim()}
                style={{ marginTop: '8px' }}
              >
                Сохранить заметку
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>История заметок</h3>
              {eventNotes.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Нет сохраненных заметок</p>
              ) : (
                eventNotes.map((note) => (
                  <div key={note.id} style={{
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {note.year} год
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {format(new Date(note.created_at), 'd MMM yyyy', { locale: ru })}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{note.note}</p>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedEvent(null);
                  setEventNotes([]);
                  setNewNote('');
                }}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfessionalLayout>
  );
}
