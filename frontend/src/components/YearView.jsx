import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDaysInMonth, startOfYear, endOfYear, isSameDay, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import './YearView.css';

export default function YearView({ selectedDate, tasks, isDayOff, onMonthClick }) {
  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);
  const months = Array.from({ length: 12 }, (_, i) => new Date(selectedDate.getFullYear(), i, 1));

  const getTasksForDay = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.date || task.created_at?.split('T')[0]);
      return isSameDay(taskDate, date);
    });
  };

  const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  return (
    <div className="year-view">
      {months.map((month, monthIndex) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const daysInMonth = getDaysInMonth(month);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const isCurrentMonth = isSameMonth(month, new Date());

        return (
          <div
            key={month.toString()}
            className={`year-month-card ${isCurrentMonth ? 'current-month' : ''}`}
          >
            <div className="year-month-header" onClick={() => onMonthClick(month)}>
              <span className="year-month-name">{MONTH_NAMES[monthIndex]}</span>
            </div>
            <div className="year-month-grid">
              {days.map(day => {
                const dayTasks = getTasksForDay(day);
                const isToday = isSameDay(day, new Date());
                const hasTasks = dayTasks.length > 0;
                const isWeekend = isDayOff && isDayOff(day);

                return (
                  <div
                    key={day.toString()}
                    className={`year-day ${isToday ? 'today' : ''} ${hasTasks ? 'has-tasks' : ''} ${isWeekend ? 'weekend' : ''}`}
                    title={hasTasks ? `${dayTasks.length} ${dayTasks.length === 1 ? 'задача' : 'задач'}` : ''}
                    onClick={() => hasTasks && onMonthClick(day)}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
