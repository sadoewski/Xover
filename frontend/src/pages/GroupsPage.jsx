import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { groupsService, tasksService } from '../services/api';
import ProfessionalLayout from '../components/ProfessionalLayout';
import { Plus, ArrowLeft, Trash2 } from 'lucide-react';
import './GroupsPage.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: 'gray' },
  in_progress: { label: 'В процессе', color: 'blue' },
  completed: { label: 'Выполнено', color: 'green' },
  cancelled: { label: 'Отменен', color: 'red' },
  moved: { label: 'Перенесен', color: 'purple' },
};

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [groupTasks, setGroupTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [groupTaskCounts, setGroupTaskCounts] = useState({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateType, setShowCreateType] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', color: '#3B82F6' });
  const [newType, setNewType] = useState({ name: '', group_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsData, typesData] = await Promise.all([
        groupsService.getGroups(),
        groupsService.getTypes(),
      ]);
      setGroups(groupsData.groups);
      setTypes(typesData.types);

      // Загружаем все задачи для подсчета
      await loadAllTasks();
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTasks = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const tasks = [];

      // Загружаем задачи за текущий год
      for (let month = 0; month < 12; month++) {
        for (let day = 1; day <= 31; day++) {
          try {
            const date = new Date(year, month, day);
            if (date.getMonth() === month) {
              const dateStr = date.toISOString().split('T')[0];
              const data = await tasksService.getTasksByDate(dateStr);
              tasks.push(...data.tasks);
            }
          } catch (e) {
            // Пропускаем ошибки
          }
        }
      }

      setAllTasks(tasks);

      // Подсчитываем задачи по группам
      const counts = {};
      tasks.forEach(task => {
        if (task.group_id) {
          counts[task.group_id] = (counts[task.group_id] || 0) + 1;
        }
      });
      setGroupTaskCounts(counts);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const loadGroupTasks = async (groupId) => {
    try {
      const filtered = allTasks.filter(task => task.group_id === groupId);
      setGroupTasks(filtered);
    } catch (error) {
      console.error('Ошибка загрузки задач группы:', error);
    }
  };

  const loadTypeTasks = async (typeId) => {
    try {
      const filtered = allTasks.filter(task => task.group_type_id === typeId);
      setGroupTasks(filtered);
    } catch (error) {
      console.error('Ошибка загрузки задач типа:', error);
    }
  };

  const handleGroupClick = async (group) => {
    setSelectedGroup(group);
    setSelectedType(null);
    await loadGroupTasks(group.id);
  };

  const handleTypeClick = async (type) => {
    setSelectedType(type);
    await loadTypeTasks(type.id);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupsService.createGroup(newGroup);
      setNewGroup({ name: '', color: '#3B82F6' });
      setShowCreateGroup(false);
      loadData();
    } catch (error) {
      console.error('Ошибка создания группы:', error);
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await groupsService.createType(newType);
      setNewType({ name: '', group_id: '' });
      setShowCreateType(false);
      loadData();
    } catch (error) {
      console.error('Ошибка создания типа:', error);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Удалить группу? Все связанные типы также будут удалены.')) return;
    try {
      await groupsService.deleteGroup(id);
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
        setGroupTasks([]);
      }
      loadData();
    } catch (error) {
      console.error('Ошибка удаления группы:', error);
    }
  };

  const handleDeleteType = async (id) => {
    if (!confirm('Удалить тип?')) return;
    try {
      await groupsService.deleteType(id);
      loadData();
    } catch (error) {
      console.error('Ошибка удаления типа:', error);
    }
  };

  const getGroupTypes = (groupId) => {
    return types.filter(t => t.group_id === groupId);
  };

  return (
    <ProfessionalLayout>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Группы записей</h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
            <div className="spinner"></div>
          </div>
        ) : selectedGroup ? (
          // Просмотр выбранной группы
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => {
                  setSelectedGroup(null);
                  setGroupTasks([]);
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
                    backgroundColor: selectedGroup.color
                  }}
                />
                <h2 className="card-title-text">
                  {selectedGroup.name}
                </h2>
              </div>
            </div>

            {/* Типы группы */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 className="card-title">Типы группы</h3>
                <button
                  onClick={() => {
                    setNewType({ ...newType, group_id: selectedGroup.id });
                    setShowCreateType(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  Добавить тип
                </button>
              </div>

              {showCreateType && (
                <form onSubmit={handleCreateType} style={{
                  marginBottom: '16px',
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-primary)'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Название типа
                    </label>
                    <input
                      type="text"
                      value={newType.name}
                      onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-primary">Создать</button>
                    <button
                      type="button"
                      onClick={() => setShowCreateType(false)}
                      className="btn btn-secondary"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getGroupTypes(selectedGroup.id).map((type) => {
                  const typeTaskCount = allTasks.filter(t => t.group_type_id === type.id).length;
                  const isSelected = selectedType?.id === type.id;
                  return (
                    <div
                      key={type.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isSelected ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--bg-hover)';
                          e.currentTarget.style.borderColor = 'var(--border-secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                          e.currentTarget.style.borderColor = 'var(--border-primary)';
                        }
                      }}
                    >
                      <button
                        onClick={() => handleTypeClick(type)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flex: 1,
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <span className="list-item-title">
                          {type.name}
                        </span>
                        <span className="list-item-subtitle" style={{ marginLeft: '8px' }}>
                          {typeTaskCount} {typeTaskCount === 1 ? 'задача' : typeTaskCount > 1 && typeTaskCount < 5 ? 'задачи' : 'задач'}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteType(type.id);
                        }}
                        className="btn-icon"
                        style={{ color: 'var(--error)', marginLeft: '16px' }}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                {getGroupTypes(selectedGroup.id).length === 0 && !showCreateType && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                    Нет типов в этой группе
                  </p>
                )}
              </div>
            </div>

            {/* Задачи группы */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>
                {selectedType ? `Задачи типа "${selectedType.name}" (${groupTasks.length})` : `Задачи группы (${groupTasks.length})`}
              </h3>
              {groupTasks.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                  {selectedType ? 'Нет задач в этом типе' : 'Нет задач в этой группе'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {groupTasks.map((task) => (
                    <div
                      key={task.id}
                      className="task-item"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <div
                        className="task-priority-indicator"
                        style={{ backgroundColor: task.priority_color }}
                      />
                      <div className="task-info">
                        <h4 className="task-title">{task.title}</h4>
                        <div className="task-meta">
                          <span>{format(parseISO(task.date), 'd MMMM yyyy', { locale: ru })}</span>
                          {task.group_type_name && (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '2px',
                              background: 'var(--bg-tertiary)',
                              fontSize: '12px'
                            }}>
                              {task.group_type_name}
                            </span>
                          )}
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
          // Список всех групп
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="card-title">Группы</h2>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Добавить группу
              </button>
            </div>

            {showCreateGroup && (
              <form onSubmit={handleCreateGroup} style={{
                marginBottom: '16px',
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                border: '1px solid var(--border-primary)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Название группы
                    </label>
                    <input
                      type="text"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
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
                      value={newGroup.color}
                      onChange={(e) => setNewGroup({ ...newGroup, color: e.target.value })}
                      style={{ height: '32px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary">Создать</button>
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="btn btn-secondary"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groups.map((group) => {
                const groupTypes = getGroupTypes(group.id);
                const taskCount = groupTaskCounts[group.id] || 0;
                return (
                  <div
                    key={group.id}
                    className="list-item"
                    style={{
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
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
                        onClick={() => handleGroupClick(group)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1,
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            flexShrink: 0,
                            backgroundColor: group.color
                          }}
                        />
                        <div>
                          <div className="list-item-title">
                            {group.name}
                          </div>
                          <div className="list-item-subtitle">
                            {groupTypes.length} {groupTypes.length === 1 ? 'тип' : 'типов'} • {taskCount} {taskCount === 1 ? 'задача' : taskCount > 1 && taskCount < 5 ? 'задачи' : 'задач'}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="btn-icon"
                        style={{ color: 'var(--error)' }}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {groups.length === 0 && !showCreateGroup && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>
                  Нет групп
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
}
