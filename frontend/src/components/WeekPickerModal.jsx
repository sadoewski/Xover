import { format, eachWeekOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { IconX } from '@tabler/icons-react';
import './WeekPickerModal.css';

export default function WeekPickerModal({ isOpen, onClose, selectedDate, onSelectWeek }) {
  if (!isOpen) return null;

  const monthIconStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const weeks = eachWeekOfInterval({ start: monthIconStart, end: monthEnd }, { locale: ru });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content week-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Выберите неделю в {format(selectedDate, 'LLLL yyyy', { locale: ru })}</h3>
          <button className="btn-icon" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="week-picker-list">
            {weeks.map((weekIconStart, index) => {
              const weekEnd = endOfWeek(weekIconStart, { locale: ru });
              const isCurrentWeek = isSameWeek(weekIconStart, selectedDate, { locale: ru });

              return (
                <div
                  key={weekIconStart.toString()}
                  className={`week-picker-item ${isCurrentWeek ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectWeek(weekIconStart);
                    onClose();
                  }}
                >
                  <span className="week-number">Неделя {index + 1}</span>
                  <span className="week-range">
                    {format(weekIconStart, 'd MMM', { locale: ru })} - {format(weekEnd, 'd MMM', { locale: ru })}
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
