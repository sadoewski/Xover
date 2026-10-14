import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsService, dataTasksService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import ProfessionalLayout from '../components/ProfessionalLayout';
import '../styles/CreateTaskBasePage.css';

const CreateTaskBasePage = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [step, setStep] = useState(1); // 1: основная информация, 2: выбор дат, 3: подтверждение
  const [name, setName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isTimeBound, setIsTimeBound] = useState(false);
  const [timeSlotStart, setTimeSlotStart] = useState('09:00');
  const [timeSlotEnd, setTimeSlotEnd] = useState('10:00');
  const [groups, setGroups] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await groupsService.getGroups();
      setGroups(response.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        showWarning('Введите название TaskBase');
        return;
      }
      if (!selectedGroup) {
        showWarning('Выберите группу задач');
        return;
      }
    } else if (step === 2) {
      if (selectedDates.length === 0) {
        showWarning('Выберите хотя бы одну дату');
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleBack = () => {
    navigate('/taskbases');
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Переводим в формат пн=0, вс=6
  };

  const toggleDate = (date) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const isDateSelected = (date) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return selectedDates.includes(dateStr);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await dataTasksService.create({
        name,
        groupId: selectedGroup,
        isTimeBound,
        timeSlotStart: isTimeBound ? timeSlotStart : null,
        timeSlotEnd: isTimeBound ? timeSlotEnd : null,
        dates: selectedDates
      });

      showSuccess('TaskBase создан');
      // Переходим в свойства созданного taskbase
      navigate(`/taskbases/${response.taskbase.id}`);
    } catch (error) {
      console.error('Error creating taskbase:', error);
      showError('Ошибка при создании TaskBase');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="create-taskbase-step">
      <h2>Основная информация</h2>

      <div className="create-taskbase-field">
        <label>Название TaskBase</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Работа"
          className="create-taskbase-input"
        />
      </div>

      <div className="create-taskbase-field">
        <label>Группа задач</label>
        <div className="create-taskbase-groups">
          {groups.map(group => (
            <div
              key={group.id}
              className={`create-taskbase-group-item ${selectedGroup === group.id ? 'selected' : ''}`}
              onClick={() => setSelectedGroup(group.id)}
            >
              <div
                className="create-taskbase-group-color"
                style={{ backgroundColor: group.color }}
              />
              <span>{group.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="create-taskbase-field">
        <label className="create-taskbase-checkbox-label">
          <input
            type="checkbox"
            checked={isTimeBound}
            onChange={(e) => setIsTimeBound(e.target.checked)}
          />
          <span>Привязка ко времени</span>
        </label>
      </div>

      {isTimeBound && (
        <div className="create-taskbase-time-fields">
          <div className="create-taskbase-field">
            <label>Начало</label>
            <input
              type="time"
              value={timeSlotStart}
              onChange={(e) => setTimeSlotStart(e.target.value)}
              className="create-taskbase-input"
            />
          </div>
          <div className="create-taskbase-field">
            <label>Конец</label>
            <input
              type="time"
              value={timeSlotEnd}
              onChange={(e) => setTimeSlotEnd(e.target.value)}
              className="create-taskbase-input"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const days = [];

    // Пустые ячейки до первого дня месяца
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div
          key={day}
          className={`calendar-day ${isDateSelected(day) ? 'selected' : ''}`}
          onClick={() => toggleDate(day)}
        >
          {day}
        </div>
      );
    }

    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    return (
      <div className="create-taskbase-step">
        <h2>Выбор дат</h2>

        <div className="calendar-controls">
          <select
            value={calendarMonth}
            onChange={(e) => setCalendarMonth(parseInt(e.target.value))}
            className="calendar-select"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            value={calendarYear}
            onChange={(e) => setCalendarYear(parseInt(e.target.value))}
            className="calendar-select"
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="calendar-grid">
          <div className="calendar-header">Пн</div>
          <div className="calendar-header">Вт</div>
          <div className="calendar-header">Ср</div>
          <div className="calendar-header">Чт</div>
          <div className="calendar-header">Пт</div>
          <div className="calendar-header">Сб</div>
          <div className="calendar-header">Вс</div>
          {days}
        </div>

        <div className="selected-dates-info">
          Выбрано дат: {selectedDates.length}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const selectedGroupData = groups.find(g => g.id === selectedGroup);

    return (
      <div className="create-taskbase-step">
        <h2>Подтверждение</h2>

        <div className="create-taskbase-summary">
          <div className="summary-item">
            <span className="summary-label">Название:</span>
            <span className="summary-value">{name}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Группа:</span>
            <div className="summary-value">
              <div
                className="summary-group-color"
                style={{ backgroundColor: selectedGroupData?.color }}
              />
              <span>{selectedGroupData?.name}</span>
            </div>
          </div>

          {isTimeBound && (
            <div className="summary-item">
              <span className="summary-label">Время:</span>
              <span className="summary-value">{timeSlotStart} - {timeSlotEnd}</span>
            </div>
          )}

          <div className="summary-item">
            <span className="summary-label">Количество дат:</span>
            <span className="summary-value">{selectedDates.length}</span>
          </div>

          <div className="summary-dates">
            <span className="summary-label">Выбранные даты:</span>
            <div className="summary-dates-list">
              {selectedDates.sort().map(date => (
                <span key={date} className="summary-date-badge">
                  {new Date(date).toLocaleDateString('ru-RU')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProfessionalLayout>
      <div className="create-taskbase-content">
        <div className="create-taskbase-header">
        <button onClick={handleBack} className="create-taskbase-back-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Создание TaskBase</h1>
        <div className="create-taskbase-steps-indicator">
          <span className={step >= 1 ? 'active' : ''}>1</span>
          <span className={step >= 2 ? 'active' : ''}>2</span>
          <span className={step >= 3 ? 'active' : ''}>3</span>
        </div>
      </div>

      <div className="create-taskbase-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      <div className="create-taskbase-footer">
        {step > 1 && (
          <button onClick={handlePrevStep} className="create-taskbase-btn-secondary">
            Назад
          </button>
        )}
        {step < 3 ? (
          <button onClick={handleNextStep} className="create-taskbase-btn-primary">
            Далее
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={loading}
            className="create-taskbase-btn-primary"
          >
            {loading ? 'Создание...' : 'Создать'}
          </button>
        )}
      </div>
      </div>
    </ProfessionalLayout>
  );
};

export default CreateTaskBasePage;
