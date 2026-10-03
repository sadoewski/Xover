import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { tasksService } from '../services/api';
import './TaskRelationModal.css';

const TaskRelationModal = ({ isOpen, onClose, currentTaskId, onTaskLinked }) => {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'create'
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Для создания новой задачи
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    groupId: '',
    priorityId: '',
    groupTypeId: '',
  });
  const [groups, setGroups] = useState([]);
  const [priorities, setPriorities] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      // Загружаем задачи для связывания (можно улучшить фильтрацию)
      const tasksResponse = await tasksService.getTasksByDate(format(new Date(), 'yyyy-MM-dd'));
      setAvailableTasks(tasksResponse.tasks || []);

      // Загружаем справочники для создания новой задачи
      const groupsModule = await import('../services/api');
      const groupsResponse = await groupsModule.groupsService.getGroups();
      const prioritiesResponse = await groupsModule.prioritiesService.getPriorities();

      setGroups(groupsResponse.groups || []);
      setPriorities(prioritiesResponse.priorities || []);

      if (groupsResponse.groups?.length > 0) {
        setNewTaskData(prev => ({ ...prev, groupId: groupsResponse.groups[0].id }));
      }
      if (prioritiesResponse.priorities?.length > 0) {
        setNewTaskData(prev => ({ ...prev, priorityId: prioritiesResponse.priorities[0].id }));
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleLinkExisting = async () => {
    if (!selectedTaskId) {
      alert('Выберите задачу для связывания');
      return;
    }

    try {
      setLoading(true);
      await tasksService.linkTasks(currentTaskId, parseInt(selectedTaskId));
      if (onTaskLinked) {
        onTaskLinked();
      }
      onClose();
    } catch (error) {
      console.error('Ошибка связывания задач:', error);
      alert('Не удалось связать задачи');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndLink = async () => {
    if (!newTaskData.title.trim()) {
      alert('Введите название задачи');
      return;
    }

    try {
      setLoading(true);

      // Создаем новую задачу со связью
      const taskData = {
        ...newTaskData,
        groupId: parseInt(newTaskData.groupId),
        priorityId: parseInt(newTaskData.priorityId),
        groupTypeId: newTaskData.groupTypeId ? parseInt(newTaskData.groupTypeId) : null,
        taskRelations: [currentTaskId], // Связываем с текущей задачей
      };

      await tasksService.createTask(taskData);

      if (onTaskLinked) {
        onTaskLinked();
      }
      onClose();
    } catch (error) {
      console.error('Ошибка создания и связывания задачи:', error);
      alert(error.response?.data?.error || 'Не удалось создать задачу');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = availableTasks.filter(task => {
    if (task.id === currentTaskId) return false;
    if (!searchQuery) return true;
    return task.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-relation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Связать задачу</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            Связать существующую
          </button>
          <button
            className={`modal-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Создать и связать
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'existing' ? (
            <div className="tab-content">
              <input
                type="text"
                placeholder="Поиск задачи..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />

              <div className="tasks-list">
                {filteredTasks.length === 0 ? (
                  <div className="empty-message">Задачи не найдены</div>
                ) : (
                  filteredTasks.map(task => (
                    <label key={task.id} className="task-item">
                      <input
                        type="radio"
                        name="selectedTask"
                        value={task.id}
                        checked={selectedTaskId === task.id.toString()}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                      />
                      <div className="task-info">
                        <div className="task-header">
                          <span className="task-group" style={{ backgroundColor: task.group_color }}>
                            {task.group_name}
                          </span>
                          <span className="task-date">
                            {format(new Date(task.date), 'd MMM', { locale: ru })}
                          </span>
                        </div>
                        <div className="task-title">{task.title}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="modal-actions">
                <button onClick={onClose} className="btn-secondary">
                  Отмена
                </button>
                <button
                  onClick={handleLinkExisting}
                  disabled={!selectedTaskId || loading}
                  className="btn-primary"
                >
                  {loading ? 'Связывание...' : 'Связать'}
                </button>
              </div>
            </div>
          ) : (
            <div className="tab-content">
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  placeholder="Введите название задачи"
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  placeholder="Введите описание"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Дата *</label>
                  <input
                    type="date"
                    value={newTaskData.date}
                    onChange={(e) => setNewTaskData({ ...newTaskData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Группа *</label>
                  <select
                    value={newTaskData.groupId}
                    onChange={(e) => setNewTaskData({ ...newTaskData, groupId: e.target.value })}
                  >
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Приоритет *</label>
                <select
                  value={newTaskData.priorityId}
                  onChange={(e) => setNewTaskData({ ...newTaskData, priorityId: e.target.value })}
                >
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>{priority.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button onClick={onClose} className="btn-secondary">
                  Отмена
                </button>
                <button
                  onClick={handleCreateAndLink}
                  disabled={loading || !newTaskData.title.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Создание...' : 'Создать и связать'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskRelationModal;
