import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight, IconChevronDown, IconChevronUp, IconClock, IconPlayerPlay, IconCircleCheck, IconX, IconCalendarEvent } from '@tabler/icons-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { tasksService } from '../services/api';
import './WeekCalendar.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: '#6b7280', icon: IconClock },
  in_progress: { label: 'В процессе', color: '#3b82f6', icon: IconPlayerPlay },
  completed: { label: 'Выполнено', color: '#10b981', icon: IconCircleCheck },
  cancelled: { label: 'Отменен', color: '#ef4444', icon: IconX },
  moved: { label: 'Перенесен', color: '#8b5cf6', icon: IconCalendarEvent },
};

export default function WeekIconCalendar({ collapsed = false, onToggleCollapse }) {
  const navigate = useNavigate();
  const [currentWeekIconStart, setCurrentWeekIconStart] = useState(() =>
    startOfWeek(new Date(), { locale: ru, weekIconStartsOn: 1 })
  );
  const [weekTasks, setWeekTasks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadWeekTasks = async () => {
      setLoading(true);
      try {
        const tasks = {};
        for (let i = 0; i < 7; i++) {
          const date = addDays(currentWeekIconStart, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const data = await tasksService.getTasksByDate(dateStr);

          // Проверяем что компонент все еще смонтирован после каждого запроса
          if (!isMounted) return;

          tasks[dateStr] = data.tasks || [];
        }

        if (isMounted) {
          setWeekTasks(tasks);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Ошибка загрузки задач недели:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWeekTasks();

    return () => {
      isMounted = false;
    };
  }, [currentWeekIconStart]);

  const handlePrevWeek = () => {
    setCurrentWeekIconStart(addDays(currentWeekIconStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekIconStart(addDays(currentWeekIconStart, 7));
  };

  const handleToday = () => {
    setCurrentWeekIconStart(startOfWeek(new Date(), { locale: ru, weekIconStartsOn: 1 }));
  };

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekIconStart, i));
  const today = new Date();

  if (collapsed) {
    return (
      <div className="week-calendar collapsed">
        <div className="week-calendar-header">
          <h3 className="week-calendar-title">Календарь недели</h3>
          <button onClick={onToggleCollapse} className="collapse-btn" title="Развернуть">
            <IconChevronDown size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="week-calendar">
      <div className="week-calendar-header">
        <h3 className="week-calendar-title">Календарь недели</h3>
        <div className="week-calendar-controls">
          <button onClick={handlePrevWeek} className="week-nav-btn" title="Предыдущая неделя">
            <IconChevronLeft size={16} />
          </button>
          <button onClick={handleToday} className="week-today-btn">
            Сегодня
          </button>
          <button onClick={handleNextWeek} className="week-nav-btn" title="Следующая неделя">
            <IconChevronRight size={16} />
          </button>
          <button onClick={onToggleCollapse} className="collapse-btn" title="Свернуть">
            <IconChevronUp size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="week-calendar-loading">Загрузка...</div>
      ) : (
        <div className="week-calendar-grid">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = weekTasks[dateStr] || [];
            const isToday = isSameDay(day, today);

            return (
              <div
                key={dateStr}
                className={`week-day ${isToday ? 'today' : ''}`}
              >
                <div className="week-day-header">
                  <div className="week-day-name">{format(day, 'EEE', { locale: ru })}</div>
                  <div className="week-day-date">{format(day, 'd')}</div>
                </div>

                <div className="week-day-tasks">
                  {dayTasks.length === 0 ? (
                    <div className="week-no-tasks">Нет задач</div>
                  ) : (
                    dayTasks.map((task) => {
                      const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div
                          key={task.id}
                          className="week-task-card"
                          style={{
                            borderLeftColor: task.group_color || '#6b7280',
                            backgroundColor: `${task.group_color || '#6b7280'}15`
                          }}
                          onClick={() => handleTaskClick(task.id)}
                        >
                          <div className="week-task-time">
                            {task.is_time_bound && task.time_slot_start
                              ? task.time_slot_start.slice(0, 5)
                              : '–'}
                          </div>
                          <div className="week-task-title">{task.title}</div>
                          <div className="week-task-status" style={{ color: status.color }}>
                            <StatusIcon size={14} className="week-task-status-icon" />
                            <span className="week-task-status-text">{status.label}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
