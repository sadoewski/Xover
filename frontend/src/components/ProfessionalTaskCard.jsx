import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Circle,
  CircleDot,
  CheckCircle2,
  XCircle,
  RotateCw,
  Clock,
  Link2,
  MoreVertical,
  Trash2,
  Repeat,
} from 'lucide-react';
import './ProfessionalTaskCard.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидает', icon: Circle, color: 'var(--status-pending)' },
  in_progress: { label: 'В процессе', icon: CircleDot, color: 'var(--status-in-progress)' },
  completed: { label: 'Завершена', icon: CheckCircle2, color: 'var(--status-completed)' },
  cancelled: { label: 'Отменена', icon: XCircle, color: 'var(--status-cancelled)' },
  moved: { label: 'Перенесена', icon: RotateCw, color: 'var(--status-moved)' },
};

const ProfessionalTaskCard = ({ task, onUpdate, onDelete, onClick, isSelected }) => {
  const navigate = useNavigate();
  const StatusIcon = STATUS_CONFIG[task.status]?.icon || Circle;

  const handleStatusChange = (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (newStatus === 'moved') {
      navigate(`/tasks/${task.id}`);
    } else {
      onUpdate(task.id, { status: newStatus });
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/tasks/${task.id}`);
    }
  };

  const isLocked = ['completed', 'cancelled', 'moved'].includes(task.status);
  const hasRelations = task.task_relations && task.task_relations.length > 0;

  return (
    <div
      className={`professional-task-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
      onClick={handleCardClick}
    >
      {/* Status Indicator */}
      <div
        className="task-status-indicator"
        style={{ background: STATUS_CONFIG[task.status]?.color }}
      />

      {/* Priority Badge */}
      <div
        className="task-priority-badge"
        style={{ background: task.priority_color }}
        title={task.priority_name}
      />

      <div className="task-card-content">
        {/* Header */}
        <div className="task-card-header">
          <div className="task-header-left">
            <StatusIcon
              size={18}
              style={{ color: STATUS_CONFIG[task.status]?.color }}
            />
            <span
              className="task-group-label"
              style={{
                background: `${task.group_color}20`,
                color: task.group_color,
                borderColor: `${task.group_color}40`,
              }}
            >
              {task.group_name}
              {task.group_type_name && ` · ${task.group_type_name}`}
            </span>
            {task.datatask_id && (
              <div
                className="task-datatask-indicator"
                title="Создано из DataTask"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/datatasks/${task.datatask_id}`);
                }}
              >
                <Repeat size={14} />
              </div>
            )}
            {hasRelations && (
              <div className="task-relation-indicator" title={`Связей: ${task.task_relations.length}`}>
                <Link2 size={14} />
              </div>
            )}
          </div>

          <div className="task-header-right">
            {task.is_time_bound && task.time_slot_start && (
              <div className="task-time-slot">
                <Clock size={12} />
                <span>{task.time_slot_start.slice(0, 5)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="task-title">{task.title}</h4>

        {/* Description */}
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        {/* Footer */}
        <div className="task-card-footer">
          <select
            className="task-status-select"
            value={task.status}
            onChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            disabled={isLocked}
          >
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>

          {!isLocked && (
            <button
              className="btn-icon btn-danger-hover"
              onClick={handleDelete}
              title="Удалить задачу"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTaskCard;
