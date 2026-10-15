import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataTasksService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import ProfessionalLayout from '../components/ProfessionalLayout';
import TablerIconRenderer from '../components/TablerIconRenderer';
import IconPickerButton from '../components/IconPicker/IconPickerButton';
import '../styles/TaskBasesPage.css';

const TaskBasesPage = () => {
  const [taskbases, setTaskBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [selectedTaskBases, setSelectedTaskBases] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadTaskBases();
  }, []);

  const loadTaskBases = async () => {
    try {
      setLoading(true);
      const response = await dataTasksService.getAll();
      setTaskBases(response.taskbases || []);
    } catch (error) {
      console.error('Error loading taskbases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    navigate('/taskbases/create');
  };

  const handleTaskBaseClick = (taskbaseId) => {
    if (selectedTaskBases.length === 0) {
      navigate(`/taskbases/${taskbaseId}`);
    }
  };

  const toggleSelectTaskBase = (taskbaseId, e) => {
    e.stopPropagation();
    setSelectedTaskBases(prev =>
      prev.includes(taskbaseId)
        ? prev.filter(id => id !== taskbaseId)
        : [...prev, taskbaseId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Удалить ${selectedTaskBases.length} taskbase(ов)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedTaskBases.map(id => dataTasksService.delete(id))
      );
      setSelectedTaskBases([]);
      setShowActionsMenu(false);
      showSuccess(`Удалено ${selectedTaskBases.length} TaskBase(ов)`);
      await loadTaskBases();
    } catch (error) {
      console.error('Error deleting taskbases:', error);
      showError('Ошибка при удалении TaskBase');
    }
  };

  const handleUpdateTaskBaseIcon = async (taskbaseId, icon) => {
    setIsUpdating(true);
    try {
      await dataTasksService.update(taskbaseId, { icon });
      await loadTaskBases();
    } catch (error) {
      console.error('Error updating taskbase icon:', error);
      showError('Ошибка при обновлении иконки');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="taskbases-page-loading">Загрузка...</div>;
  }

  return (
    <ProfessionalLayout>
      <div className="taskbases-content">
        <div className="taskbases-header">
        <h1 className="taskbases-title">TaskBases</h1>
        <div className="taskbases-actions">
          <button
            className="taskbases-action-btn taskbases-create-btn"
            onClick={handleCreateClick}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="taskbases-action-btn taskbases-menu-btn"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          {showActionsMenu && (
            <div className="taskbases-dropdown-menu">
              {selectedTaskBases.length > 0 && (
                <button onClick={handleDeleteSelected} className="taskbases-menu-item danger">
                  Удалить выбранные ({selectedTaskBases.length})
                </button>
              )}
              {selectedTaskBases.length === 0 && (
                <div className="taskbases-menu-item disabled">
                  Выберите taskbases для действий
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {taskbases.length === 0 ? (
        <div className="taskbases-empty">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="16" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 24H56M20 16V12M44 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="34" r="2" fill="currentColor"/>
            <circle cx="32" cy="34" r="2" fill="currentColor"/>
            <circle cx="44" cy="34" r="2" fill="currentColor"/>
          </svg>
          <p>Нет созданных TaskBases</p>
          <button onClick={handleCreateClick} className="taskbases-empty-create-btn">
            Создать первый TaskBase
          </button>
        </div>
      ) : (
        <div className="taskbases-list">
          {taskbases.map(taskbase => (
            <div
              key={taskbase.id}
              className={`taskbase-card ${selectedTaskBases.includes(taskbase.id) ? 'selected' : ''}`}
              onClick={() => handleTaskBaseClick(taskbase.id)}
            >
              <div className="taskbase-card-header">
                <input
                  type="checkbox"
                  checked={selectedTaskBases.includes(taskbase.id)}
                  onChange={(e) => toggleSelectTaskBase(taskbase.id, e)}
                  className="taskbase-checkbox"
                />
                <TablerIconRenderer
                  iconName={taskbase.icon || 'refresh'}
                  size={20}
                  color={taskbase.group_color || '#6366f1'}
                  className="taskbase-icon"
                />
                <h3 className="taskbase-name">{taskbase.name}</h3>
              </div>
              <div className="taskbase-card-body">
                <div className="taskbase-group">
                  <span
                    className="taskbase-group-badge"
                    style={{ backgroundColor: taskbase.group_color }}
                  >
                    {taskbase.group_name}
                  </span>
                </div>
                <div className="taskbase-info">
                  <span className="taskbase-dates-count">
                    {taskbase.dates_count} {taskbase.dates_count === 1 ? 'день' : 'дней'}
                  </span>
                  {taskbase.is_time_bound && (
                    <span className="taskbase-time">
                      {taskbase.time_slot_start?.substring(0, 5)} - {taskbase.time_slot_end?.substring(0, 5)}
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

export default TaskBasesPage;
