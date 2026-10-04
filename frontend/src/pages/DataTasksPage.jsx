import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataTasksService } from '../services/api';
import ProfessionalLayout from '../components/ProfessionalLayout';
import '../styles/DataTasksPage.css';

const DataTasksPage = () => {
  const [datatasks, setDatatasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [selectedDatatasks, setSelectedDatatasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDatatasks();
  }, []);

  const loadDatatasks = async () => {
    try {
      setLoading(true);
      const response = await dataTasksService.getAll();
      setDatatasks(response.datatasks || []);
    } catch (error) {
      console.error('Error loading datatasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    navigate('/datatasks/create');
  };

  const handleDatataskClick = (datataskId) => {
    if (selectedDatatasks.length === 0) {
      navigate(`/datatasks/${datataskId}`);
    }
  };

  const toggleSelectDatatask = (datataskId, e) => {
    e.stopPropagation();
    setSelectedDatatasks(prev =>
      prev.includes(datataskId)
        ? prev.filter(id => id !== datataskId)
        : [...prev, datataskId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Удалить ${selectedDatatasks.length} datatask(ов)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedDatatasks.map(id => dataTasksService.delete(id))
      );
      setSelectedDatatasks([]);
      setShowActionsMenu(false);
      await loadDatatasks();
    } catch (error) {
      console.error('Error deleting datatasks:', error);
      alert('Ошибка при удалении datatasks');
    }
  };

  if (loading) {
    return <div className="datatasks-page-loading">Загрузка...</div>;
  }

  return (
    <ProfessionalLayout>
      <div className="datatasks-content">
        <div className="datatasks-header">
        <h1 className="datatasks-title">DataTasks</h1>
        <div className="datatasks-actions">
          <button
            className="datatasks-action-btn datatasks-create-btn"
            onClick={handleCreateClick}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="datatasks-action-btn datatasks-menu-btn"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          {showActionsMenu && (
            <div className="datatasks-dropdown-menu">
              {selectedDatatasks.length > 0 && (
                <button onClick={handleDeleteSelected} className="datatasks-menu-item danger">
                  Удалить выбранные ({selectedDatatasks.length})
                </button>
              )}
              {selectedDatatasks.length === 0 && (
                <div className="datatasks-menu-item disabled">
                  Выберите datatasks для действий
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {datatasks.length === 0 ? (
        <div className="datatasks-empty">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="16" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 24H56M20 16V12M44 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="34" r="2" fill="currentColor"/>
            <circle cx="32" cy="34" r="2" fill="currentColor"/>
            <circle cx="44" cy="34" r="2" fill="currentColor"/>
          </svg>
          <p>Нет созданных DataTasks</p>
          <button onClick={handleCreateClick} className="datatasks-empty-create-btn">
            Создать первый DataTask
          </button>
        </div>
      ) : (
        <div className="datatasks-list">
          {datatasks.map(datatask => (
            <div
              key={datatask.id}
              className={`datatask-card ${selectedDatatasks.includes(datatask.id) ? 'selected' : ''}`}
              onClick={() => handleDatataskClick(datatask.id)}
            >
              <div className="datatask-card-header">
                <input
                  type="checkbox"
                  checked={selectedDatatasks.includes(datatask.id)}
                  onChange={(e) => toggleSelectDatatask(datatask.id, e)}
                  className="datatask-checkbox"
                />
                <h3 className="datatask-name">{datatask.name}</h3>
              </div>
              <div className="datatask-card-body">
                <div className="datatask-group">
                  <span
                    className="datatask-group-badge"
                    style={{ backgroundColor: datatask.group_color }}
                  >
                    {datatask.group_name}
                  </span>
                </div>
                <div className="datatask-info">
                  <span className="datatask-dates-count">
                    {datatask.dates_count} {datatask.dates_count === 1 ? 'день' : 'дней'}
                  </span>
                  {datatask.is_time_bound && (
                    <span className="datatask-time">
                      {datatask.time_slot_start?.substring(0, 5)} - {datatask.time_slot_end?.substring(0, 5)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </ProfessionalLayout>
  );
};

export default DataTasksPage;
