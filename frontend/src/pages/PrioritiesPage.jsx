import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prioritiesService, tasksService } from '../services/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import ProfessionalLayout from '../components/ProfessionalLayout';
import { Plus, ArrowLeft, Trash2 } from 'lucide-react';
import './PrioritiesPage.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: 'gray' },
  in_progress: { label: 'В процессе', color: 'blue' },
  completed: { label: 'Выполнено', color: 'green' },
  cancelled: { label: 'Отменен', color: 'red' },
  moved: { label: 'Перенесен', color: 'purple' },
};

export default function PrioritiesPage() {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPriority, setNewPriority] = useState({
    name: '',
    color: '#3B82F6',
    level: 1,
  });

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  useEffect(() => {
    loadPriorities();
  }, []);

  const loadPriorities = async () => {
    try {
      const data = await prioritiesService.getPriorities();
      setPriorities(data.priorities);
    } catch (error) {
      console.error('Ошибка загрузки приоритетов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriorityTasks = async (priorityId) => {
    try {
      // Загружаем все задачи и фильтруем по приоритету
      const today = new Date();
      const year = today.getFullYear();

      const allTasks = [];
      for (let month = 0; month < 12; month++) {
        for (let day = 1; day <= 31; day++) {
          try {
            const date = new Date(year, month, day);
            if (date.getMonth() === month) {
              const dateStr = date.toISOString().split('T')[0];
              const data = await tasksService.getTasksByDate(dateStr);
              allTasks.push(...data.tasks);
            }
          } catch (e) {
            // Пропускаем ошибки
          }
        }
      }

      const filtered = allTasks.filter(task => task.priority_id === priorityId);
      setPriorityTasks(filtered);
    } catch (error) {
      console.error('Ошибка загрузки задач приоритета:', error);
    }
  };

  const handlePriorityClick = async (priority) => {
    setSelectedPriority(priority);
    await loadPriorityTasks(priority.id);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await prioritiesService.createPriority(newPriority);
      setNewPriority({ name: '', color: '#3B82F6', level: 1 });
      setShowCreate(false);
      loadPriorities();
    } catch (error) {
      console.error('Ошибка создания приоритета:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить приоритет?')) return;
    try {
      await prioritiesService.deletePriority(id);
      if (selectedPriority?.id === id) {
        setSelectedPriority(null);
        setPriorityTasks([]);
      }
      loadPriorities();
    } catch (error) {
      console.error('Ошибка удаления приоритета:', error);
    }
  };

  return (
    <ProfessionalLayout>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Приоритеты</h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
            <div className="spinner"></div>
          </div>
        ) : selectedPriority ? (
          // Просмотр выбранного приоритета
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => {
                  setSelectedPriority(null);
                  setPriorityTasks([]);
                }}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} />
                Назад
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    backgroundColor: selectedPriority.color
                  }}
                />
                <div>
                  <h2 className="card-title-text">
                    {selectedPriority.name}
                  </h2>
                  <p className="list-item-subtitle">
                    Уровень {selectedPriority.level}
                  </p>
                </div>
              </div>
            </div>

            {/* Задачи приоритета */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>
                Задачи с приоритетом ({priorityTasks.length})
              </h3>
              {priorityTasks.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                  Нет задач с этим приоритетом
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {priorityTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className="task-item"
                    >
                      <div
                        className="task-priority-indicator"
                        style={{ backgroundColor: task.priority_color }}
                      />
                      <div className="task-info">
                        <h4 className="task-title">{task.title}</h4>
                        <div className="task-meta">
                          <span>
                            {task.date ? format(parseISO(task.date), 'd MMMM yyyy', { locale: ru }) : 'Дата не указана'}
                          </span>
                          <span
                            className="task-group"
                            style={{
                              backgroundColor: task.group_color + '20',
                              color: task.group_color,
                            }}
                          >
                            {task.group_name}
                            {task.group_type_name && ` → ${task.group_type_name}`}
                          </span>
                          <span className={`task-status task-status-${task.status}`}>
                            {STATUS_CONFIG[task.status]?.label}
                          </span>
                        </div>
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Список всех приоритетов
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="card-title">Список приоритетов</h2>
              <button
                onClick={() => setShowCreate(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Добавить приоритет
              </button>
            </div>

            {showCreate && (
              <form onSubmit={handleCreate} style={{
                marginBottom: '16px',
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                border: '1px solid var(--border-primary)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Название
                    </label>
                    <input
                      type="text"
                      value={newPriority.name}
                      onChange={(e) => setNewPriority({ ...newPriority, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Цвет
                    </label>
                    <input
                      type="color"
                      value={newPriority.color}
                      onChange={(e) => setNewPriority({ ...newPriority, color: e.target.value })}
                      style={{ height: '32px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Уровень (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={newPriority.level}
                      onChange={(e) => setNewPriority({ ...newPriority, level: parseInt(e.target.value) })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary">Создать</button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="btn btn-secondary"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {priorities
                .sort((a, b) => a.level - b.level)
                .map((priority) => (
                  <div
                    key={priority.id}
                    className="list-item"
                    style={{
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-primary)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        onClick={() => handlePriorityClick(priority)}
                        style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            flexShrink: 0,
                            backgroundColor: priority.color
                          }}
                        />
                        <div>
                          <div className="list-item-title">
                            {priority.name}
                          </div>
                          <div className="list-item-subtitle">
                            Уровень {priority.level}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDelete(priority.id)}
                        className="btn-icon"
                        style={{ color: 'var(--error)' }}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              {priorities.length === 0 && !showCreate && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>
                  Нет приоритетов
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
}
