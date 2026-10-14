import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataTasksService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import ProfessionalLayout from '../components/ProfessionalLayout';
import '../styles/TaskBaseDetailPage.css';

const TaskBaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [taskbase, setTaskBase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const { showSuccess, showError, showWarning } = useNotification();

  useEffect(() => {
    loadTaskBase();
  }, [id]);

  const loadTaskBase = async () => {
    try {
      setLoading(true);
      const response = await dataTasksService.getById(id);
      setTaskBase(response.taskbase);
      setEditedName(response.taskbase.name);
    } catch (error) {
      console.error('Error loading taskbase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/taskbases');
  };

  const handleUpdateName = async () => {
    if (!editedName.trim()) {
      showWarning('Название не может быть пустым');
      return;
    }

    try {
      await dataTasksService.update(id, { name: editedName });
      setIsEditing(false);
      showSuccess('Название обновлено');
      await loadTaskBase();
    } catch (error) {
      console.error('Error updating name:', error);
      showError('Ошибка при обновлении названия');
    }
  };

  const handleDeleteDate = async (date) => {
    if (!window.confirm(`Удалить дату ${new Date(date).toLocaleDateString('ru-RU')}?`)) {
      return;
    }

    try {
      await dataTasksService.removeDate(id, date);
      showSuccess('Дата удалена');
      await loadTaskBase();
    } catch (error) {
      console.error('Error deleting date:', error);
      showError('Ошибка при удалении даты');
    }
  };

  const handleAddDates = () => {
    navigate(`/taskbases/${id}/add-dates`);
  };

  const handleDeleteTaskBase = async () => {
    if (!window.confirm('Удалить этот TaskBase и все связанные задачи?')) {
      return;
    }

    try {
      await dataTasksService.delete(id);
      showSuccess('TaskBase удален');
      navigate('/taskbases');
    } catch (error) {
      console.error('Error deleting taskbase:', error);
      showError('Ошибка при удалении TaskBase');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#94a3b8';
      case 'completed':
        return '#22c55e';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Ожидается';
      case 'completed':
        return 'Выполнено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="taskbase-detail-loading">Загрузка...</div>;
  }

  if (!taskbase) {
    return <div className="taskbase-detail-error">TaskBase не найден</div>;
  }

  return (
    <ProfessionalLayout>
      <div className="taskbase-detail-content">
        <div className="taskbase-detail-header">
        <button onClick={handleBack} className="taskbase-detail-back-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Свойства TaskBase</h1>
      </div>

      <div className="taskbase-detail-content">
        <div className="taskbase-detail-section">
          <div className="taskbase-detail-section-header">
            <h2>Основная информация</h2>
          </div>

          <div className="taskbase-detail-info">
            <div className="taskbase-detail-row">
              <span className="taskbase-detail-label">Название:</span>
              {isEditing ? (
                <div className="taskbase-detail-edit">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="taskbase-detail-input"
                  />
                  <button onClick={handleUpdateName} className="taskbase-detail-save-btn">
                    Сохранить
                  </button>
                  <button onClick={() => setIsEditing(false)} className="taskbase-detail-cancel-btn">
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="taskbase-detail-value">
                  <span>{taskbase.name}</span>
                  <button onClick={() => setIsEditing(true)} className="taskbase-detail-edit-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667.666.667-3.666 9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="taskbase-detail-row">
              <span className="taskbase-detail-label">Группа:</span>
              <div className="taskbase-detail-value">
                <div
                  className="taskbase-detail-group-color"
                  style={{ backgroundColor: taskbase.group_color }}
                />
                <span>{taskbase.group_name}</span>
              </div>
            </div>

            {taskbase.is_time_bound && (
              <div className="taskbase-detail-row">
                <span className="taskbase-detail-label">Время:</span>
                <span className="taskbase-detail-value">
                  {taskbase.time_slot_start?.substring(0, 5)} - {taskbase.time_slot_end?.substring(0, 5)}
                </span>
              </div>
            )}

            <div className="taskbase-detail-row">
              <span className="taskbase-detail-label">Создан:</span>
              <span className="taskbase-detail-value">
                {new Date(taskbase.created_at).toLocaleString('ru-RU')}
              </span>
            </div>
          </div>
        </div>

        <div className="taskbase-detail-section">
          <div className="taskbase-detail-section-header">
            <h2>Даты ({taskbase.dates?.length || 0})</h2>
            <button onClick={handleAddDates} className="taskbase-detail-add-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Добавить даты
            </button>
          </div>

          <div className="taskbase-dates-list">
            {taskbase.dates?.sort((a, b) => new Date(a.date) - new Date(b.date)).map((dateObj) => (
              <div key={dateObj.date} className="taskbase-date-item">
                <div className="taskbase-date-info">
                  <span className="taskbase-date-text">
                    {new Date(dateObj.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span
                    className="taskbase-date-status"
                    style={{ color: getStatusColor(dateObj.status) }}
                  >
                    {getStatusText(dateObj.status)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteDate(dateObj.date)}
                  className="taskbase-date-delete-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="taskbase-detail-danger-zone">
          <h3>Опасная зона</h3>
          <p>Удаление TaskBase также удалит все связанные задачи</p>
          <button onClick={handleDeleteTaskBase} className="taskbase-detail-delete-btn">
            Удалить TaskBase
          </button>
        </div>
      </div>
      </div>
    </ProfessionalLayout>
  );
};

export default TaskBaseDetailPage;
