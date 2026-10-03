import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import StatusIcon from './StatusIcon';
import './MonthView.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: '#6b7280' },
  in_progress: { label: 'В процессе', color: '#4a9eff' },
  completed: { label: 'Выполнено', color: '#22c55e' },
  cancelled: { label: 'Отменен', color: '#ef4444' },
  moved: { label: 'Перенесен', color: '#a855f7' },
};

export default function MonthView({ selectedDate, tasks, isDayOff, onWeekClick }) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { locale: ru });
  const calendarEnd = endOfWeek(monthEnd, { locale: ru });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="month-view-calendar">
      <div className="month-calendar-header">
        {weekDays.map(day => (
          <div key={day} className="month-weekday-header">
            {day}
          </div>
        ))}
      </div>
      <div className="month-calendar-grid">
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isWeekend = isDayOff && isDayOff(day);

          return (
            <div
              key={day.toString()}
              className={`month-day-cell ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isWeekend ? 'weekend' : ''}`}
              onClick={() => onWeekClick(day)}
            >
              <div className="month-day-number">
                {format(day, 'd')}
                {isWeekend && <span className="weekend-dot"></span>}
              </div>
              <div className="month-day-tasks">
                {dayTasks.slice(0, 4).map(task => {
                  // Определяем, продолжается ли задача на следующий день
                  const isOvernight = task.is_time_bound && task.time_slot_start && task.time_slot_end && task.time_slot_end < task.time_slot_start;
                  const taskDate = new Date(task.date);
                  const isContinuation = task.is_continuation || (isOvernight && !isSameDay(taskDate, day));
                  const hasNextDay = isOvernight && isSameDay(taskDate, day);

                  return (
                    <div
                      key={task.id}
                      className={`month-task-item ${isContinuation ? 'continuation' : ''} ${hasNextDay ? 'has-next-day' : ''}`}
                      style={{ borderLeft: `2px solid ${STATUS_CONFIG[task.status]?.color}` }}
                    >
                      <StatusIcon
                        status={task.status}
                        color={STATUS_CONFIG[task.status]?.color}
                        size={14}
                      />
                      <span className="month-task-title">
                        {task.title}
                        {isContinuation && ' ←'}
                        {hasNextDay && ' →'}
                      </span>
                    </div>
                  );
                })}
                {dayTasks.length > 4 && (
                  <div className="month-task-more">+{dayTasks.length - 4} ещё</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
