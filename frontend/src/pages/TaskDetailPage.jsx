import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Clock, Calendar, Tag, Link as LinkIcon, CheckSquare, FileText, Trash2, Repeat } from 'lucide-react';
import { tasksService } from '../services/api';
import ProfessionalLayout from '../components/ProfessionalLayout';
import RelatedTasksList from '../components/RelatedTasksList';
import TaskRelationModal from '../components/TaskRelationModal';
import './TaskDetailPage.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: 'gray' },
  in_progress: { label: 'В процессе', color: 'blue' },
  completed: { label: 'Выполнено', color: 'green' },
  cancelled: { label: 'Отменен', color: 'red' },
  moved: { label: 'Перенесен', color: 'purple' },
};

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReadonly = searchParams.get('readonly') === 'true';
  const [task, setTask] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // 'checklist', 'links', null
  const [checklistInput, setChecklistInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [moveToDate, setMoveToDate] = useState('');
  const [error, setError] = useState('');
  const [logsSortOrder, setLogsSortOrder] = useState('desc'); // 'desc' - новые вверху, 'asc' - старые вверху

  useEffect(() => {
    loadTaskData();
  }, [id]);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      const [taskData, logsData] = await Promise.all([
        tasksService.getTaskById(id),
        tasksService.getTaskLogs(id),
      ]);
      setTask(taskData.task);
      setLogs(logsData.logs);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Не удалось загрузить данные задачи');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'moved') {
      setShowMoveModal(true);
      return;
    }

    try {
      await tasksService.updateTask(id, { status: newStatus });
      await loadTaskData();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      alert('Ошибка изменения статуса');
    }
  };

  const handleMoveTask = async () => {
    if (!moveToDate) {
      alert('Выберите дату для переноса');
      return;
    }

    try {
      // Сначала обновляем дату и статус
      await tasksService.updateTask(id, {
        status: 'moved',
        date: moveToDate,
        movedFromDate: task.date,
        movedToDate: moveToDate,
      });
      setShowMoveModal(false);
      await loadTaskData();
      // Перенаправляем на новую дату в календаре
      navigate(`/calendar?date=${moveToDate}`);
    } catch (error) {
      console.error('Ошибка переноса задачи:', error);
      alert('Ошибка переноса задачи');
    }
  };

  const handleChecklistUpdate = async () => {
    try {
      const updatedChecklist = task.checklist || [];
      await tasksService.updateTask(id, { checklist: updatedChecklist });
      await loadTaskData();
      setEditing(null);
    } catch (error) {
      console.error('Ошибка обновления чеклиста:', error);
      alert('Ошибка обновления чеклиста');
    }
  };

  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;

    const updatedChecklist = [...(task.checklist || []), { text: checklistInput, checked: false }];
    setTask({ ...task, checklist: updatedChecklist });
    setChecklistInput('');
  };

  const toggleChecklistItem = (index) => {
    const updatedChecklist = [...task.checklist];
    updatedChecklist[index].checked = !updatedChecklist[index].checked;
    setTask({ ...task, checklist: updatedChecklist });
  };

  const removeChecklistItem = (index) => {
    const updatedChecklist = task.checklist.filter((_, i) => i !== index);
    setTask({ ...task, checklist: updatedChecklist });
  };

  const addLink = async () => {
    if (!linkInput.trim()) return;

    try {
      const newLink = {
        text: linkInput,
        created_at: new Date().toISOString(),
      };
      const updatedLinks = [...(task.links || []), newLink];
      await tasksService.updateTask(id, { links: updatedLinks });
      await loadTaskData();
      setLinkInput('');
      setEditing(null);
    } catch (error) {
      console.error('Ошибка добавления линка:', error);
      alert('Ошибка добавления линка');
    }
  };

  const removeLink = async (index) => {
    try {
      const updatedLinks = task.links.filter((_, i) => i !== index);
      await tasksService.updateTask(id, { links: updatedLinks });
      await loadTaskData();
    } catch (error) {
      console.error('Ошибка удаления линка:', error);
      alert('Ошибка удаления линка');
    }
  };

  if (loading) {
    return (
      <ProfessionalLayout>
        <div className="page-content">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        </div>
      </ProfessionalLayout>
    );
  }

  if (error || !task) {
    return (
      <ProfessionalLayout>
        <div className="page-content">
          <div className="error-message">{error || 'Задача не найдена'}</div>
        </div>
      </ProfessionalLayout>
    );
  }

  return (
    <ProfessionalLayout>
      <div className="page-content">
        <div className="task-detail-page">
          {/* Header */}
          <div className="task-detail-header">
            <button
              onClick={() => navigate(-1)}
              className="btn-icon"
              title="Назад"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="task-detail-actions">
              <button
                onClick={() => setShowLogsModal(true)}
                className="btn btn-secondary"
              >
                <FileText size={16} />
                Логи
              </button>
              <span className="task-id">ID: {task.id}</span>
            </div>
          </div>

          {/* Main Info Card */}
          <div className="card">
            <div className="task-main-info">
              <div
                className="priority-badge-large"
                style={{ backgroundColor: task.priority_color }}
              >
                {STATUS_CONFIG[task.status]?.label?.[0] || '○'}
              </div>
              <div className="task-info-content">
                <h1 className="task-detail-title">{task.title}</h1>
                <div className="task-meta-tags">
                  <span
                    className="meta-tag"
                    style={{
                      backgroundColor: task.group_color + '30',
                      color: task.group_color,
                      borderColor: task.group_color
                    }}
                  >
                    <Tag size={14} />
                    {task.group_name}
                    {task.group_type_name && ` → ${task.group_type_name}`}
                  </span>
                  <span className="meta-tag">
                    <Tag size={14} />
                    {task.priority_name}
                  </span>
                  <span className="meta-tag">
                    <Calendar size={14} />
                    {format(parseISO(task.date), 'd MMMM yyyy', { locale: ru })}
                  </span>
                  {task.is_time_bound && task.time_slot_start && (
                    <span className="meta-tag">
                      <Clock size={14} />
                      {task.time_slot_start.slice(0, 5)} - {task.time_slot_end?.slice(0, 5) || ''}
                    </span>
                  )}
                  {task.moved_from_date && (
                    <span className="meta-tag meta-tag-moved">
                      Перенесена с {format(parseISO(task.moved_from_date), 'd MMMM', { locale: ru })}
                    </span>
                  )}
                  {task.datatask_id && (
                    <span
                      className="meta-tag meta-tag-datatask"
                      onClick={() => navigate(`/datatasks/${task.datatask_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Repeat size={14} />
                      Создано из DataTask
                    </span>
                  )}
                </div>
              </div>
            </div>

            {task.description && (
              <div className="task-description-section">
                <h3 className="section-title">Описание</h3>
                <p className="task-description-text">{task.description}</p>
              </div>
            )}
          </div>

          {/* Status Card */}
          <div className="card">
            <h3 className="card-title">Статус</h3>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="select"
              disabled={['completed', 'cancelled'].includes(task.status)}
            >
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Checklist Card */}
          <div className="card">
            <div className="card-header-flex">
              <h3 className="card-title">
                <CheckSquare size={18} />
                Чек-лист
              </h3>
              {editing !== 'checklist' && (
                <button
                  onClick={() => setEditing('checklist')}
                  className="btn btn-secondary btn-sm"
                >
                  Редактировать
                </button>
              )}
            </div>

            {editing === 'checklist' ? (
              <div className="edit-section">
                {/* Existing items in edit mode */}
                {task.checklist && task.checklist.length > 0 && (
                  <div className="checklist-items" style={{ marginBottom: '1rem' }}>
                    {task.checklist.map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const updatedChecklist = [...task.checklist];
                            updatedChecklist[index].text = e.target.value;
                            setTask({ ...task, checklist: updatedChecklist });
                          }}
                          className="input"
                          style={{ flex: 1 }}
                        />
                        <button
                          onClick={() => removeChecklistItem(index)}
                          className="btn-icon btn-delete"
                          title="Удалить пункт"
                          style={{ marginLeft: '0.5rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input for new item */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && checklistInput.trim()) {
                        addChecklistItem();
                      }
                    }}
                    className="input"
                    placeholder="Новый пункт чек-листа"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={addChecklistItem}
                    className="btn btn-primary"
                    disabled={!checklistInput.trim()}
                    style={{ marginLeft: '0.5rem', minWidth: '40px' }}
                  >
                    +
                  </button>
                </div>

                <div className="edit-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={handleChecklistUpdate} className="btn btn-primary">
                    Сохранить
                  </button>
                  {task.checklist && task.checklist.length > 0 && (
                    <button
                      onClick={async () => {
                        if (confirm('Удалить весь чек-лист?')) {
                          try {
                            await tasksService.updateTask(id, { checklist: [] });
                            await loadTaskData();
                            setEditing(null);
                          } catch (error) {
                            console.error('Ошибка удаления чек-листа:', error);
                            alert('Ошибка удаления чек-листа');
                          }
                        }
                      }}
                      className="btn btn-secondary"
                    >
                      Удалить весь чек-лист
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditing(null);
                      loadTaskData();
                    }}
                    className="btn btn-secondary"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="checklist-view">
                {task.checklist && task.checklist.length > 0 ? (
                  task.checklist.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--surface-2, #f9fafb)',
                      transition: 'background-color 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={item.checked || false}
                        onChange={async () => {
                          const updatedChecklist = [...task.checklist];
                          updatedChecklist[index].checked = !updatedChecklist[index].checked;
                          try {
                            await tasksService.updateTask(id, { checklist: updatedChecklist });
                            await loadTaskData();
                          } catch (error) {
                            console.error('Ошибка обновления чек-листа:', error);
                            alert('Ошибка обновления чек-листа');
                          }
                        }}
                        className="checkbox"
                        style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                      />
                      <span style={{
                        flex: 1,
                        textDecoration: item.checked ? 'line-through' : 'none',
                        color: item.checked ? '#6b7280' : 'inherit',
                        transition: 'all 0.2s'
                      }}>
                        {item.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">Нет пунктов чек-листа</p>
                )}
              </div>
            )}
          </div>

          {/* Links Card */}
          <div className="card">
            <div className="card-header-flex">
              <h3 className="card-title">
                <LinkIcon size={18} />
                Линки
              </h3>
              {editing !== 'links' && (
                <button
                  onClick={() => setEditing('links')}
                  className="btn btn-secondary btn-sm"
                >
                  Добавить линк
                </button>
              )}
            </div>

            {editing === 'links' && (
              <div className="edit-section">
                <textarea
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  className="textarea"
                  rows="3"
                  placeholder="Введите комментарий"
                />
                <div className="edit-actions">
                  <button onClick={addLink} className="btn btn-primary">
                    Сохранить
                  </button>
                  <button onClick={() => setEditing(null)} className="btn btn-secondary">
                    Отмена
                  </button>
                </div>
              </div>
            )}

            <div className="links-list">
              {task.links && task.links.length > 0 ? (
                [...task.links].reverse().map((link, index) => {
                  const actualIndex = task.links.length - index;
                  return (
                    <div key={index} className="link-item">
                      <div className="link-content">
                        <div className="link-header">
                          <span className="link-number">#{actualIndex}</span>
                          <p className="link-text">{typeof link === 'string' ? link : link.text}</p>
                        </div>
                        {link.created_at && (
                          <div className="link-timestamp">
                            {format(parseISO(link.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeLink(task.links.length - index - 1)}
                        className="btn-icon btn-delete"
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="empty-text">Нет линков</p>
              )}
            </div>
          </div>

          {/* Related Tasks */}
          {!isReadonly && (
            <div className="card">
              <div className="card-header-flex">
                <h3 className="card-title">Связанные задачи</h3>
                <button
                  onClick={() => setShowRelationModal(true)}
                  className="btn btn-secondary btn-sm"
                >
                  Добавить связь
                </button>
              </div>

              <RelatedTasksList
                taskRelations={task.task_relations || []}
                currentTaskId={parseInt(id)}
                onUnlink={loadTaskData}
              />
            </div>
          )}
        </div>
      </div>

      {/* Task Relation Modal */}
      {showRelationModal && (
        <TaskRelationModal
          isOpen={showRelationModal}
          onClose={() => setShowRelationModal(false)}
          currentTaskId={parseInt(id)}
          onTaskLinked={loadTaskData}
        />
      )}

      {/* Move Task Modal */}
      {showMoveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Перенести задачу</h3>
            <p className="modal-description">Выберите дату, на которую нужно перенести задачу:</p>
            <input
              type="date"
              value={moveToDate}
              onChange={(e) => setMoveToDate(e.target.value)}
              className="input"
            />
            <div className="modal-actions">
              <button onClick={handleMoveTask} className="btn btn-primary">
                Перенести
              </button>
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setMoveToDate('');
                }}
                className="btn btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3 className="modal-title">История изменений</h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="btn-icon"
              >
                ✕
              </button>
            </div>

            <div className="logs-controls" style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
              <button
                onClick={() => setLogsSortOrder(logsSortOrder === 'desc' ? 'asc' : 'desc')}
                className="btn btn-secondary"
              >
                {logsSortOrder === 'desc' ? '↓ Новые вверху' : '↑ Старые вверху'}
              </button>
            </div>

            <div className="logs-table-container" style={{ overflowX: 'auto', padding: '1rem' }}>
              {logs.length > 0 ? (
                <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem', fontWeight: '600' }}>№</th>
                      <th style={{ padding: '0.75rem', fontWeight: '600' }}>Дата и время</th>
                      <th style={{ padding: '0.75rem', fontWeight: '600' }}>Действие</th>
                      <th style={{ padding: '0.75rem', fontWeight: '600' }}>Старое значение</th>
                      <th style={{ padding: '0.75rem', fontWeight: '600' }}>Новое значение</th>
                      <th style={{ padding: '0.75rem', fontWeight: '600' }}>Подробности</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(logs || [])].sort((a, b) => {
                      const dateA = new Date(a.created_at);
                      const dateB = new Date(b.created_at);
                      return logsSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                    }).map((log, index) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                          {logsSortOrder === 'desc' ? logs.length - index : index + 1}
                        </td>
                        <td style={{ padding: '0.75rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {format(parseISO(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                        </td>
                        <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                          {log.action === 'created' ? 'Задача создана' :
                           log.action === 'status_changed' ? 'Изменен статус' :
                           log.action === 'moved' ? 'Задача перенесена' :
                           log.action === 'priority_changed' ? 'Изменен приоритет' :
                           log.action === 'checklist_updated' ? 'Обновлен чек-лист' :
                           log.action === 'checklist_item_added' ? 'Добавлен пункт чек-листа' :
                           log.action === 'checklist_item_removed' ? 'Удален пункт чек-листа' :
                           log.action === 'checklist_item_checked' ? 'Отмечен пункт чек-листа' :
                           log.action === 'checklist_item_unchecked' ? 'Снята отметка' :
                           log.action === 'checklist_item_text_changed' ? 'Изменен текст пункта' :
                           log.action === 'checklist_deleted' ? 'Удален весь чек-лист' :
                           log.action === 'link_added' ? 'Добавлен линк' :
                           log.action === 'link_removed' ? 'Удален линк' :
                           log.action === 'title_changed' ? 'Изменено название' :
                           log.action === 'description_changed' ? 'Изменено описание' :
                           log.action === 'task_linked' ? 'Связана задача' :
                           log.action === 'task_unlinked' ? 'Удалена связь' :
                           log.action === 'linked_task_added' ? 'Добавлена связанная задача' :
                           log.action === 'linked_task_removed' ? 'Удалена связанная задача' :
                           log.action}
                        </td>
                        <td style={{ padding: '0.75rem', verticalAlign: 'top', maxWidth: '200px', wordBreak: 'break-word' }}>
                          {log.old_value ? (
                            <span style={{ color: '#dc3545', fontStyle: 'italic' }}>
                              {log.old_value}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem', verticalAlign: 'top', maxWidth: '200px', wordBreak: 'break-word' }}>
                          {log.new_value ? (
                            <span style={{ color: '#28a745', fontWeight: '500' }}>
                              {log.new_value}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem', verticalAlign: 'top', maxWidth: '300px', wordBreak: 'break-word' }}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-text text-center">Нет истории изменений</p>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowLogsModal(false)}
                className="btn btn-secondary"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfessionalLayout>
  );
}
