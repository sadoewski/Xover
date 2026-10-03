import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { tasksService } from '../services/api';
import './RelatedTasksList.css';

const RelatedTasksList = ({ taskRelations, currentTaskId, onUnlink }) => {
  const [relatedTasks, setRelatedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRelatedTasks();
  }, [taskRelations]);

  const loadRelatedTasks = async () => {
    if (!taskRelations || taskRelations.length === 0) {
      setRelatedTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const taskIds = taskRelations.map(rel => rel.task_id);
      const response = await tasksService.getTasksByIds(taskIds);
      setRelatedTasks(response.tasks || []);
    } catch (error) {
      console.error('Ошибка загрузки связанных задач:', error);
      setRelatedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}?readonly=true`);
  };

  const handleUnlink = async (taskId) => {
    if (!window.confirm('Удалить связь с этой задачей?')) {
      return;
    }

    try {
      await tasksService.unlinkTasks(currentTaskId, taskId);
      if (onUnlink) {
        onUnlink();
      }
    } catch (error) {
      console.error('Ошибка удаления связи:', error);
      alert('Не удалось удалить связь');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Ожидает',
      in_progress: 'В процессе',
      completed: 'Завершена',
      cancelled: 'Отменена',
      moved: 'Перенесена',
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  if (loading) {
    return <div className="related-tasks-loading">Загрузка связанных задач...</div>;
  }

  if (relatedTasks.length === 0) {
    return <div className="related-tasks-empty">Нет связанных задач</div>;
  }

  return (
    <div className="related-tasks-list">
      {relatedTasks.map((task) => (
        <div key={task.id} className="related-task-item">
          <div className="related-task-main" onClick={() => handleTaskClick(task.id)}>
            <div className="related-task-header">
              <span
                className="related-task-group"
                style={{ backgroundColor: task.group_color }}
              >
                {task.group_name}
              </span>
              <span
                className={`related-task-status ${getStatusClass(task.status)}`}
              >
                {getStatusText(task.status)}
              </span>
            </div>
            <div className="related-task-title">{task.title}</div>
            <div className="related-task-footer">
              <span className="related-task-date">
                {format(new Date(task.date), 'd MMMM yyyy', { locale: ru })}
              </span>
              <span
                className="related-task-priority"
                style={{ color: task.priority_color }}
              >
                {task.priority_name}
              </span>
            </div>
          </div>
          <button
            className="related-task-unlink"
            onClick={() => handleUnlink(task.id)}
            title="Удалить связь"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default RelatedTasksList;
