import { format, eachWeekOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { X } from 'lucide-react';
import './WeekPickerModal.css';

export default function WeekPickerModal({ isOpen, onClose, selectedDate, onSelectWeek }) {
  if (!isOpen) return null;

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { locale: ru });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content week-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Выберите неделю в {format(selectedDate, 'LLLL yyyy', { locale: ru })}</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="week-picker-list">
            {weeks.map((weekStart, index) => {
              const weekEnd = endOfWeek(weekStart, { locale: ru });
              const isCurrentWeek = isSameWeek(weekStart, selectedDate, { locale: ru });

              return (
                <div
                  key={weekStart.toString()}
                  className={`week-picker-item ${isCurrentWeek ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectWeek(weekStart);
                    onClose();
                  }}
                >
                  <span className="week-number">Неделя {index + 1}</span>
                  <span className="week-range">
                    {format(weekStart, 'd MMM', { locale: ru })} - {format(weekEnd, 'd MMM', { locale: ru })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
