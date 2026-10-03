import { format, eachMonthOfInterval, startOfYear, endOfYear, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { X } from 'lucide-react';
import './MonthPickerModal.css';

export default function MonthPickerModal({ isOpen, onClose, selectedDate, onSelectMonth }) {
  if (!isOpen) return null;

  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content month-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Выберите месяц в {format(selectedDate, 'yyyy', { locale: ru })} году</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="month-picker-grid">
            {months.map((month) => {
              const isCurrentMonth = isSameMonth(month, selectedDate);

              return (
                <div
                  key={month.toString()}
                  className={`month-picker-item ${isCurrentMonth ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectMonth(month);
                    onClose();
                  }}
                >
                  {format(month, 'LLLL', { locale: ru })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
