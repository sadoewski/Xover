import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksService, eventsService } from '../services/api';
import { format, addDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import ProfessionalLayout from '../components/ProfessionalLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './DashboardPage.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: 'gray' },
  in_progress: { label: 'В процессе', color: 'blue' },
  completed: { label: 'Выполнено', color: 'green' },
  cancelled: { label: 'Отменен', color: 'red' },
  moved: { label: 'Перенесен', color: 'purple' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStatus, setExpandedStatus] = useState(null);

  useEffect(() => {
    loadTodayTasks();
    loadUpcomingEvents();
    loadTodayEvents();
  }, [currentDate]);

  const loadTodayTasks = async () => {
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const data = await tasksService.getTasksByDate(dateStr);
      setTasks(data.tasks);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayEvents = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const data = await eventsService.getEventsByDate(month, day);
      setTodayEvents(data.events || []);
    } catch (error) {
      console.error('Ошибка загрузки событий дня:', error);
    }
  };

  const handlePrevDay = () => {
    setCurrentDate(addDays(currentDate, -1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await tasksService.updateTask(taskId, { status: newStatus });
      loadTodayTasks();
    } catch (error) {
      console.error('Ошибка обновления статуса задачи:', error);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const data = await eventsService.getEvents();
      const allEvents = data.events;

      // Найти ближайшие события (в следующие 30 дней)
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();

      const upcoming = allEvents
        .map(event => {
          // Вычисляем сколько дней до события
          let daysUntil;

          if (event.month > currentMonth || (event.month === currentMonth && event.day >= currentDay)) {
            // Событие в этом году
            const eventDate = new Date(today.getFullYear(), event.month - 1, event.day);
            daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
          } else {
            // Событие в следующем году
            const eventDate = new Date(today.getFullYear() + 1, event.month - 1, event.day);
            daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
          }

          return { ...event, daysUntil };
        })
        .filter(event => event.daysUntil >= 0 && event.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5);

      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    }
  };

  // Статистика по статусам
  const statusStats = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
    cancelled: tasks.filter(t => t.status === 'cancelled'),
    moved: tasks.filter(t => t.status === 'moved'),
  };

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const toggleStatusExpand = (status) => {
    setExpandedStatus(expandedStatus === status ? null : status);
  };

  return (
    <ProfessionalLayout>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Админ-панель</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px'
            }}>
              <div>{format(currentDate, 'd MMMM yyyy', { locale: ru })}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {format(currentDate, 'EEEE', { locale: ru })}
              </div>
            </div>
          </div>
        </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="dashboard-grid">
              {/* Статистика */}
              <div className="stats-cards">
                {/* Всего задач */}
                <div className="stat-card">
                  <div className="stat-label">Всего задач</div>
                  <div className="stat-value">{tasks.length}</div>
                </div>

                {/* Ожидается */}
                <div className="stat-card" onClick={() => toggleStatusExpand('pending')}>
                  <div className="stat-label">Ожидается</div>
                  <div className="stat-value">{statusStats.pending.length}</div>
                  {expandedStatus === 'pending' && statusStats.pending.length > 0 && (
                    <div className="stat-tasks">
                      {statusStats.pending.map((task) => (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task.id);
                          }}
                          className="stat-task-item"
                        >
                          <div className="stat-task-title">{task.title}</div>
                          <div className="stat-task-time">
                            {task.is_time_bound && task.time_slot_start
                              ? `${task.time_slot_start.slice(0, 5)}`
                              : 'Свободно'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {statusStats.pending.length > 0 && (
                    <button className="stat-toggle">
                      {expandedStatus === 'pending' ? 'Свернуть' : 'Показать задачи'}
                    </button>
                  )}
                </div>

                {/* Выполнено */}
                <div className="stat-card stat-card-completed" onClick={() => toggleStatusExpand('completed')}>
                  <div className="stat-label">Выполнено</div>
                  <div className="stat-value stat-value-completed">{statusStats.completed.length}</div>
                  {expandedStatus === 'completed' && statusStats.completed.length > 0 && (
                    <div className="stat-tasks">
                      {statusStats.completed.map((task) => (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task.id);
                          }}
                          className="stat-task-item"
                        >
                          <div className="stat-task-title">{task.title}</div>
                          <div className="stat-task-time">
                            {task.is_time_bound && task.time_slot_start
                              ? `${task.time_slot_start.slice(0, 5)}`
                              : 'Свободно'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {statusStats.completed.length > 0 && (
                    <button className="stat-toggle">
                      {expandedStatus === 'completed' ? 'Свернуть' : 'Показать задачи'}
                    </button>
                  )}
                </div>

                {/* Отменено */}
                <div className="stat-card">
                  <div className="stat-label">Отменено</div>
                  <div className="stat-value">{statusStats.cancelled.length}</div>
                </div>

                {/* Перенесено */}
                <div className="stat-card">
                  <div className="stat-label">Перенесено</div>
                  <div className="stat-value">{statusStats.moved.length}</div>
                </div>
              </div>

              {/* Задачи на выбранную дату */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 className="card-title">
                    Задачи на {format(currentDate, 'd MMMM', { locale: ru })}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={handlePrevDay}
                      className="btn-icon"
                      title="Предыдущий день"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={handleToday}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Сегодня
                    </button>
                    <button
                      onClick={handleNextDay}
                      className="btn-icon"
                      title="Следующий день"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* События дня */}
                {todayEvents.length > 0 && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'var(--accent-bg)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: '6px'
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                      🎉 События дня:
                    </h3>
                    {todayEvents.map((event) => (
                      <div key={event.id} style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        • {event.name} ({event.type === 'birthday' ? 'День рождения' : 'Праздник'})
                      </div>
                    ))}
                  </div>
                )}

                {tasks.length === 0 ? (
                  <p className="empty-text">Нет задач на эту дату</p>
                ) : (
                  <div className="task-list">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task.id)}
                        className="task-item"
                      >
                        {/* Иконка приоритета */}
                        <div
                          className="task-priority-indicator"
                          style={{ backgroundColor: task.priority_color }}
                        />

                        {/* Информация о задаче */}
                        <div className="task-info">
                          <h3 className="task-title">{task.title}</h3>
                          <div className="task-meta">
                            <span
                              className="task-group"
                              style={{
                                backgroundColor: task.group_color + '20',
                                color: task.group_color,
                              }}
                            >
                              {task.group_name}
                              {task.group_type_name && ` → ${task.group_type_name}`}
                            </span>
                            <span className="task-time">
                              {task.is_time_bound && task.time_slot_start
                                ? `${task.time_slot_start.slice(0, 5)} - ${task.time_slot_end?.slice(0, 5) || ''}`
                                : 'Свободно'}
                            </span>
                          </div>
                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}
                        </div>

                        {/* Выбор статуса */}
                        <div style={{ marginLeft: 'auto', paddingLeft: '16px' }} onClick={(e) => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                            className="select"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            <option value="pending">Ожидается</option>
                            <option value="in_progress">В процессе</option>
                            <option value="completed">Выполнено</option>
                            <option value="cancelled">Отменено</option>
                            <option value="moved">Перенесено</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ближайшие события */}
              <div className="card">
                <h2 className="card-title">Ближайшие дни рождения и праздники</h2>
                {upcomingEvents.length === 0 ? (
                  <p className="empty-text">Нет предстоящих событий в ближайшие 30 дней</p>
                ) : (
                  <div className="events-list">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="event-item">
                        <div className="event-info">
                          <div className="event-header">
                            <h3 className="event-name">{event.name}</h3>
                            <span className={`event-type event-type-${event.type}`}>
                              {event.type === 'birthday' ? 'ДР' : 'Праздник'}
                            </span>
                          </div>
                          <div className="event-date">
                            {event.day} {['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                              'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][event.month - 1]}
                          </div>
                          {event.description && (
                            <p className="event-description">{event.description}</p>
                          )}
                        </div>
                        <div className="event-countdown">
                          <div className={`event-days event-days-${
                            event.daysUntil === 0 ? 'today' :
                            event.daysUntil <= 7 ? 'soon' :
                            'later'
                          }`}>
                            {event.daysUntil === 0 ? 'Сегодня!' :
                             event.daysUntil === 1 ? 'Завтра' :
                             `Через ${event.daysUntil} дн.`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </ProfessionalLayout>
  );
}
