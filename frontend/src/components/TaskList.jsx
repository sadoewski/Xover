import { useNavigate } from 'react-router-dom';
import { Link2, CheckSquare, GitMerge } from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    label: 'Ожидается',
    color: 'gray',
    icon: '○',
  },
  in_progress: {
    label: 'В процессе',
    color: 'blue',
    icon: '◐',
  },
  completed: {
    label: 'Выполнено',
    color: 'green',
    icon: '●',
  },
  cancelled: {
    label: 'Отменен',
    color: 'red',
    icon: '✕',
  },
  moved: {
    label: 'Перенесен',
    color: 'purple',
    icon: '↻',
  },
};

export default function TaskList({ tasks, onUpdateTask, onDeleteTask }) {
  const navigate = useNavigate();

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await onUpdateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
    }
  };

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Нет записей на этот день</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="card flex items-start gap-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleTaskClick(task.id)}
        >
          {/* Номер задачи */}
          <div className="flex-shrink-0 w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
            {index + 1}
          </div>

          {/* Иконка статуса с цветом приоритета */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
            style={{ backgroundColor: task.priority_color }}
          >
            {STATUS_CONFIG[task.status]?.icon || '○'}
          </div>

          {/* Основная информация */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {task.title}
                  </h3>

                  {/* Иконки свойств задачи */}
                  <div className="flex items-center gap-1">
                    {task.links && task.links.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600" title={`Ссылок: ${task.links.length}`}>
                        <Link2 size={14} />
                        <span>{task.links.length}</span>
                      </span>
                    )}
                    {task.checklists && task.checklists.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600" title={`Чеклистов: ${task.checklists.length}`}>
                        <CheckSquare size={14} />
                        <span>{task.checklists.length}</span>
                      </span>
                    )}
                    {task.task_relations && task.task_relations.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-600" title={`Связанных задач: ${task.task_relations.length}`}>
                        <GitMerge size={14} />
                        <span>{task.task_relations.length}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: task.group_color + '20', color: task.group_color }}
                  >
                    {task.group_name}
                    {task.group_type_name && ` → ${task.group_type_name}`}
                  </span>
                  <span className="text-gray-500">
                    {task.is_time_bound && task.time_slot_start
                      ? `${task.time_slot_start.slice(0, 5)} - ${task.time_slot_end?.slice(0, 5) || ''}`
                      : 'Свободно'}
                  </span>
                </div>
                {task.description && (
                  <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                )}
              </div>

              {/* Статус */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={['completed', 'cancelled', 'moved'].includes(task.status)}
                >
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>

                {!['completed', 'cancelled', 'moved'].includes(task.status) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Удалить эту запись?')) {
                        onDeleteTask(task.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Удалить"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
