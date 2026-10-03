import { format, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import StatusIcon from './StatusIcon';
import './WeekView.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: '#6b7280' },
  in_progress: { label: 'В процессе', color: '#4a9eff' },
  completed: { label: 'Выполнено', color: '#22c55e' },
  cancelled: { label: 'Отменен', color: '#ef4444' },
  moved: { label: 'Перенесен', color: '#a855f7' },
};

export default function WeekView({ selectedDate, tasks, isDayOff, onDayClick }) {
  const weekStart = startOfWeek(selectedDate, { locale: ru });
  const weekEnd = endOfWeek(selectedDate, { locale: ru });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.date || task.created_at?.split('T')[0]);
      const isSameTaskDay = isSameDay(taskDate, day);

      // Проверяем, является ли задача продолжением с предыдущего дня
      if (!isSameTaskDay && task.is_time_bound && task.time_slot_start && task.time_slot_end) {
        // Если время переходит на следующий день (end < start), проверяем предыдущий день
        if (task.time_slot_end < task.time_slot_start) {
          const previousDay = new Date(day);
          previousDay.setDate(previousDay.getDate() - 1);
          return isSameDay(taskDate, previousDay);
        }
      }

      return isSameTaskDay;
    });
  };

  return (
    <div className="week-view-compact">
      {days.map(day => {
        const dayTasks = getTasksForDay(day);
        const isToday = isSameDay(day, new Date());
        const isWeekend = isDayOff && isDayOff(day);

        return (
          <div
            key={day.toString()}
            className={`week-day-compact ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
          >
            <div className="week-day-header-compact" onClick={() => onDayClick(day)}>
              <span className="week-day-name-compact">{format(day, 'EEE', { locale: ru })}</span>
              <span className="week-day-number-compact">{format(day, 'd')}</span>
              {isWeekend && <span className="weekend-indicator">Выходной</span>}
            </div>
            <div className="week-day-tasks-list">
              {dayTasks.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '10px' }}>
                  Нет задач
                </div>
              ) : (
                dayTasks.map(task => {
                  // Определяем, продолжается ли задача на следующий день
                  const isOvernight = task.is_time_bound && task.time_slot_start && task.time_slot_end && task.time_slot_end < task.time_slot_start;
                  const taskDate = new Date(task.date);
                  const isContinuation = task.is_continuation || (isOvernight && !isSameDay(taskDate, day));
                  const hasNextDay = isOvernight && isSameDay(taskDate, day);

                  return (
                    <div
                      key={task.id}
                      className={`week-task-item ${isContinuation ? 'continuation' : ''} ${hasNextDay ? 'has-next-day' : ''}`}
                      onClick={() => onDayClick(day)}
                      style={{ borderLeftColor: STATUS_CONFIG[task.status]?.color }}
                    >
                      <div className="week-task-header">
                        <StatusIcon
                          status={task.status}
                          color={STATUS_CONFIG[task.status]?.color}
                          size={16}
                        />
                        <span className="week-task-title">
                          {task.title}
                          {isContinuation && <span className="continuation-badge">← продолжение</span>}
                          {hasNextDay && <span className="continuation-badge">продолжается →</span>}
                        </span>
                      </div>
                      <div className="week-task-meta">
                        {task.is_time_bound && task.time_slot_start && (
                          <div className="week-task-time">
                            <Clock size={10} />
                            {task.time_slot_start.slice(0, 5)}
                            {task.time_slot_end ? `-${task.time_slot_end.slice(0, 5)}` : ''}
                          </div>
                        )}
                        <div className="week-task-badges">
                          {task.group_name && (
                            <span
                              className="week-task-group"
                              style={{ backgroundColor: task.group_color }}
                            >
                              {task.group_name}
                            </span>
                          )}
                          {task.priority_name && (
                            <span
                              className="week-task-priority"
                              style={{ backgroundColor: task.priority_color }}
                            >
                              {task.priority_name}
                            </span>
                          )}
                        </div>
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
  );
}
