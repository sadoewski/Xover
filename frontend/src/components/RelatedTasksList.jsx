import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { tasksService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useSafeAsync } from '../hooks/useSafeAsync';
import './RelatedTasksList.css';

const RelatedTasksList = ({ taskRelations, currentTaskId, onUnlink }) => {
  const [relatedTasks, setRelatedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const runAsync = useSafeAsync();

  useEffect(() => {
    runAsync(async (isMounted) => {
      if (!taskRelations || taskRelations.length === 0) {
        if (isMounted.current) {
          setRelatedTasks([]);
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
        }
        const taskIds = taskRelations.map(rel => rel.task_id);
        const response = await tasksService.getTasksByIds(taskIds);
        if (isMounted.current) {
          setRelatedTasks(response.tasks || []);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error('Ошибка загрузки связанных задач:', error);
          setRelatedTasks([]);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    });
  }, [taskRelations, runAsync]);

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}?readonly=true`);
  };

  const handleUnlink = async (taskId) => {
    if (!window.confirm('Удалить связь с этой задачей?')) {
      return;
    }

    try {
      await tasksService.unlinkTasks(currentTaskId, taskId);
      showSuccess('Связь успешно удалена');
      if (onUnlink) {
        onUnlink();
      }
    } catch (error) {
      console.error('Ошибка удаления связи:', error);
      showError('Не удалось удалить связь');
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
