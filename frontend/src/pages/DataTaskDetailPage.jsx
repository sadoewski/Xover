import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfessionalLayout from '../components/ProfessionalLayout';
import '../styles/DataTaskDetailPage.css';

const DataTaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [datatask, setDatatask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    loadDatatask();
  }, [id]);

  const loadDatatask = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/datatasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatatask(response.data.datatask);
      setEditedName(response.data.datatask.name);
    } catch (error) {
      console.error('Error loading datatask:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/datatasks');
  };

  const handleUpdateName = async () => {
    if (!editedName.trim()) {
      alert('Название не может быть пустым');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5001/api/datatasks/${id}`,
        { name: editedName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
      await loadDatatask();
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Ошибка при обновлении названия');
    }
  };

  const handleDeleteDate = async (date) => {
    if (!window.confirm(`Удалить дату ${new Date(date).toLocaleDateString('ru-RU')}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/datatasks/${id}/dates/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadDatatask();
    } catch (error) {
      console.error('Error deleting date:', error);
      alert('Ошибка при удалении даты');
    }
  };

  const handleAddDates = () => {
    navigate(`/datatasks/${id}/add-dates`);
  };

  const handleDeleteDatatask = async () => {
    if (!window.confirm('Удалить этот DataTask и все связанные задачи?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/datatasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/datatasks');
    } catch (error) {
      console.error('Error deleting datatask:', error);
      alert('Ошибка при удалении datatask');
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
    return <div className="datatask-detail-loading">Загрузка...</div>;
  }

  if (!datatask) {
    return <div className="datatask-detail-error">DataTask не найден</div>;
  }

  return (
    <ProfessionalLayout>
      <div className="datatask-detail-content">
        <div className="datatask-detail-header">
        <button onClick={handleBack} className="datatask-detail-back-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Свойства DataTask</h1>
      </div>

      <div className="datatask-detail-content">
        <div className="datatask-detail-section">
          <div className="datatask-detail-section-header">
            <h2>Основная информация</h2>
          </div>

          <div className="datatask-detail-info">
            <div className="datatask-detail-row">
              <span className="datatask-detail-label">Название:</span>
              {isEditing ? (
                <div className="datatask-detail-edit">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="datatask-detail-input"
                  />
                  <button onClick={handleUpdateName} className="datatask-detail-save-btn">
                    Сохранить
                  </button>
                  <button onClick={() => setIsEditing(false)} className="datatask-detail-cancel-btn">
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="datatask-detail-value">
                  <span>{datatask.name}</span>
                  <button onClick={() => setIsEditing(true)} className="datatask-detail-edit-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667.666.667-3.666 9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="datatask-detail-row">
              <span className="datatask-detail-label">Группа:</span>
              <div className="datatask-detail-value">
                <div
                  className="datatask-detail-group-color"
                  style={{ backgroundColor: datatask.group_color }}
                />
                <span>{datatask.group_name}</span>
              </div>
            </div>

            {datatask.is_time_bound && (
              <div className="datatask-detail-row">
                <span className="datatask-detail-label">Время:</span>
                <span className="datatask-detail-value">
                  {datatask.time_slot_start?.substring(0, 5)} - {datatask.time_slot_end?.substring(0, 5)}
                </span>
              </div>
            )}

            <div className="datatask-detail-row">
              <span className="datatask-detail-label">Создан:</span>
              <span className="datatask-detail-value">
                {new Date(datatask.created_at).toLocaleString('ru-RU')}
              </span>
            </div>
          </div>
        </div>

        <div className="datatask-detail-section">
          <div className="datatask-detail-section-header">
            <h2>Даты ({datatask.dates?.length || 0})</h2>
            <button onClick={handleAddDates} className="datatask-detail-add-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Добавить даты
            </button>
          </div>

          <div className="datatask-dates-list">
            {datatask.dates?.sort((a, b) => new Date(a.date) - new Date(b.date)).map((dateObj) => (
              <div key={dateObj.date} className="datatask-date-item">
                <div className="datatask-date-info">
                  <span className="datatask-date-text">
                    {new Date(dateObj.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span
                    className="datatask-date-status"
                    style={{ color: getStatusColor(dateObj.status) }}
                  >
                    {getStatusText(dateObj.status)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteDate(dateObj.date)}
                  className="datatask-date-delete-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="datatask-detail-danger-zone">
          <h3>Опасная зона</h3>
          <p>Удаление DataTask также удалит все связанные задачи</p>
          <button onClick={handleDeleteDatatask} className="datatask-detail-delete-btn">
            Удалить DataTask
          </button>
        </div>
      </div>
      </div>
    </ProfessionalLayout>
  );
};

export default DataTaskDetailPage;
