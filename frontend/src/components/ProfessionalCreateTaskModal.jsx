import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { X, Plus, Clock, Link2, Search } from 'lucide-react';
import { tasksService } from '../services/api';
import './ProfessionalCreateTaskModal.css';

const ProfessionalCreateTaskModal = ({ isOpen, onClose, onCreateTask, groups, priorities, selectedDate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    groupId: '',
    groupTypeId: '',
    priorityId: '',
    isTimeBound: false,
    timeSlotStart: '',
    timeSlotEnd: '',
    taskRelations: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedGroup = groups.find(g => g.id === parseInt(formData.groupId));
  const groupTypes = selectedGroup?.types || [];

  useEffect(() => {
    if (groups.length > 0 && !formData.groupId) {
      setFormData(prev => ({ ...prev, groupId: groups[0].id }));
    }
    if (priorities.length > 0 && !formData.priorityId) {
      setFormData(prev => ({ ...prev, priorityId: priorities[0].id }));
    }
  }, [groups, priorities]);

  useEffect(() => {
    if (isOpen && showTaskSelector) {
      loadAvailableTasks();
    }
  }, [isOpen, showTaskSelector]);

  const loadAvailableTasks = async () => {
    try {
      const response = await tasksService.getTasksByDate(format(new Date(), 'yyyy-MM-dd'));
      setAvailableTasks(response.tasks || []);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const taskDate = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate < today) {
        setError('Нельзя создавать задачи на прошедшие даты');
        setLoading(false);
        return;
      }

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        groupId: parseInt(formData.groupId),
        groupTypeId: formData.groupTypeId ? parseInt(formData.groupTypeId) : null,
        priorityId: parseInt(formData.priorityId),
        date: format(selectedDate, 'yyyy-MM-dd'),
        isTimeBound: formData.isTimeBound,
        timeSlotStart: formData.isTimeBound ? formData.timeSlotStart : null,
        timeSlotEnd: formData.isTimeBound ? formData.timeSlotEnd : null,
        taskRelations: formData.taskRelations.length > 0 ? formData.taskRelations : undefined,
      };

      await onCreateTask(taskData);

      setFormData({
        title: '',
        description: '',
        groupId: groups[0]?.id || '',
        groupTypeId: '',
        priorityId: priorities[0]?.id || '',
        isTimeBound: false,
        timeSlotStart: '',
        timeSlotEnd: '',
        taskRelations: [],
      });
      setShowTaskSelector(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания задачи');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskRelation = (taskId) => {
    setFormData(prev => {
      const relations = prev.taskRelations.includes(taskId)
        ? prev.taskRelations.filter(id => id !== taskId)
        : [...prev.taskRelations, taskId];
      return { ...prev, taskRelations: relations };
    });
  };

  const filteredTasks = availableTasks.filter(task =>
    searchQuery ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  if (!isOpen) return null;

  return (
    <div className="professional-modal-overlay" onClick={onClose}>
      <div className="professional-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Создать задачу</h2>
            <p className="modal-subtitle">
              {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: ru })}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="form-field">
            <label className="form-label">
              Название <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите название задачи"
            />
          </div>

          {/* Group & Priority Row */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">
                Группа <span className="required">*</span>
              </label>
              <select
                required
                className="select"
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value, groupTypeId: '' })}
              >
                <option value="">Выберите группу</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">
                Приоритет <span className="required">*</span>
              </label>
              <select
                required
                className="select"
                value={formData.priorityId}
                onChange={(e) => setFormData({ ...formData, priorityId: e.target.value })}
              >
                <option value="">Выберите приоритет</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group Type */}
          {groupTypes.length > 0 && (
            <div className="form-field">
              <label className="form-label">Вид группы</label>
              <select
                className="select"
                value={formData.groupTypeId}
                onChange={(e) => setFormData({ ...formData, groupTypeId: e.target.value })}
              >
                <option value="">Не выбрано</option>
                {groupTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="form-field">
            <label className="form-label">Описание</label>
            <textarea
              className="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Введите описание задачи"
            />
          </div>

          {/* Time Bound */}
          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox"
                checked={formData.isTimeBound}
                onChange={(e) => setFormData({ ...formData, isTimeBound: e.target.checked })}
              />
              <Clock size={16} />
              <span>Привязать ко времени</span>
            </label>
          </div>

          {/* Time Slots */}
          {formData.isTimeBound && (
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Начало</label>
                <input
                  type="time"
                  required
                  className="input"
                  value={formData.timeSlotStart}
                  onChange={(e) => setFormData({ ...formData, timeSlotStart: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Конец</label>
                <input
                  type="time"
                  className="input"
                  value={formData.timeSlotEnd}
                  onChange={(e) => setFormData({ ...formData, timeSlotEnd: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Task Relations */}
          <div className="form-field">
            <div className="relation-header">
              <label className="form-label">
                <Link2 size={16} />
                Связанные задачи
              </label>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setShowTaskSelector(!showTaskSelector)}
              >
                {showTaskSelector ? 'Скрыть' : 'Выбрать'}
              </button>
            </div>

            {formData.taskRelations.length > 0 && (
              <div className="selected-count">
                Выбрано: {formData.taskRelations.length}
              </div>
            )}

            {showTaskSelector && (
              <div className="task-selector">
                <div className="search-box">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Поиск задачи..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="tasks-selector-list">
                  {filteredTasks.length === 0 ? (
                    <div className="empty-message">Задачи не найдены</div>
                  ) : (
                    filteredTasks.map(task => (
                      <label key={task.id} className="task-selector-item">
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={formData.taskRelations.includes(task.id)}
                          onChange={() => toggleTaskRelation(task.id)}
                        />
                        <div className="task-selector-info">
                          <span
                            className="task-selector-group"
                            style={{ background: `${task.group_color}20`, color: task.group_color }}
                          >
                            {task.group_name}
                          </span>
                          <span className="task-selector-title">{task.title}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Создать задачу
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfessionalCreateTaskModal;
