import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { tasksService, groupsService, prioritiesService } from '../services/api';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: 'gray' },
  in_progress: { label: 'В процессе', color: 'blue' },
  completed: { label: 'Выполнено', color: 'green' },
  cancelled: { label: 'Отменен', color: 'red' },
  moved: { label: 'Перенесен', color: 'purple' },
};

export default function HostboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

  // Checklist state
  const [checklist, setChecklist] = useState([]);
  const [checklistInput, setChecklistInput] = useState('');
  const [editingChecklist, setEditingChecklist] = useState(false);

  // Links (comments) state
  const [links, setLinks] = useState([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState('');

  // Logs state
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [taskData, prioritiesData] = await Promise.all([
        tasksService.getTaskById(id),
        prioritiesService.getPriorities(),
      ]);

      setTask(taskData.task);
      setPriorities(prioritiesData.priorities);

      // Parse checklist if exists
      if (taskData.task.checklist) {
        try {
          setChecklist(JSON.parse(taskData.task.checklist));
        } catch (e) {
          setChecklist([]);
        }
      }

      // Parse links if exists
      if (taskData.task.links) {
        try {
          setLinks(JSON.parse(taskData.task.links));
        } catch (e) {
          setLinks([]);
        }
      }

      // Parse logs if exists
      if (taskData.task.logs) {
        try {
          setLogs(JSON.parse(taskData.task.logs));
        } catch (e) {
          setLogs([]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки задачи:', error);
      alert('Задача не найдена');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (updates) => {
    try {
      await tasksService.updateTask(id, updates);

      // Add log entry
      const logEntry = {
        timestamp: new Date().toISOString(),
        changes: updates,
      };
      const newLogs = [...logs, logEntry];
      await tasksService.updateTask(id, { logs: JSON.stringify(newLogs) });

      setLogs(newLogs);
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
      alert('Ошибка обновления задачи');
    }
  };

  const handlePriorityChange = async (priorityId) => {
    const oldPriority = task.priority_id;
    await updateTask({ priority_id: priorityId });
  };

  const handleTimeChange = async (isFreeTime, timeSlotStart = null, timeSlotEnd = null) => {
    await updateTask({
      is_free_time: isFreeTime,
      time_slot_start: timeSlotStart,
      time_slot_end: timeSlotEnd,
    });
  };

  const handleChecklistToggle = async (index) => {
    const newChecklist = [...checklist];
    newChecklist[index].checked = !newChecklist[index].checked;
    setChecklist(newChecklist);
    await updateTask({ checklist: JSON.stringify(newChecklist) });
  };

  const addChecklistItem = async () => {
    if (checklistInput.trim()) {
      const newChecklist = [...checklist, { text: checklistInput, checked: false }];
      setChecklist(newChecklist);
      setChecklistInput('');
      await updateTask({ checklist: JSON.stringify(newChecklist) });
    }
  };

  const removeChecklistItem = async (index) => {
    const newChecklist = checklist.filter((_, i) => i !== index);
    setChecklist(newChecklist);
    await updateTask({ checklist: JSON.stringify(newChecklist) });
  };

  const addLink = async () => {
    if (newLink.trim()) {
      const newLinkObj = {
        text: newLink,
        created_at: new Date().toISOString(),
      };
      const newLinks = [...links, newLinkObj];
      setLinks(newLinks);
      setNewLink('');
      setShowAddLink(false);
      await updateTask({ links: JSON.stringify(newLinks) });
    }
  };

  const deleteLink = async (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
    await updateTask({ links: JSON.stringify(newLinks) });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const priority = priorities.find(p => p.id === task.priority_id);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              ← Назад
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Hostboard</h1>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="btn btn-secondary"
          >
            {showLogs ? 'Скрыть логи' : 'Показать логи'}
          </button>
        </div>

        {showLogs && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">История изменений</h2>
            {logs.length === 0 ? (
              <p className="text-gray-500">История пуста</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">
                      {format(parseISO(log.timestamp), 'd MMMM yyyy, HH:mm', { locale: ru })}
                    </div>
                    <div className="text-sm">
                      {Object.entries(log.changes).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {JSON.stringify(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main task info */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{task.title}</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Дата создания:</span>
              <span className="ml-2 font-medium">
                {format(parseISO(task.created_at), 'd MMMM yyyy', { locale: ru })}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Дата выполнения:</span>
              <span className="ml-2 font-medium">
                {format(parseISO(task.date), 'd MMMM yyyy', { locale: ru })}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Группа:</span>
              <span className="ml-2 font-medium">{task.group_name}</span>
            </div>
            {task.group_type_name && (
              <div>
                <span className="text-gray-600">Тип:</span>
                <span className="ml-2 font-medium">{task.group_type_name}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Статус:</span>
              <span className="ml-2 font-medium">{STATUS_CONFIG[task.status]?.label}</span>
            </div>
          </div>
        </div>

        {/* Priority */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-3">Приоритет</h3>
          <div className="grid grid-cols-2 gap-3">
            {priorities.map((p) => (
              <div
                key={p.id}
                onClick={() => handlePriorityChange(p.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  priority?.id === p.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="font-medium">{p.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time binding */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-3">Привязка ко времени</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={task.is_free_time}
                onChange={() => handleTimeChange(true)}
                className="w-4 h-4"
              />
              <span>Свободное выполнение</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!task.is_free_time}
                onChange={() => {}}
                className="w-4 h-4"
              />
              <span>Тайм-слот</span>
            </label>

            {!task.is_free_time && (
              <div className="mt-3 grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Начало</label>
                  <input
                    type="time"
                    value={task.time_slot_start || ''}
                    onChange={(e) => handleTimeChange(false, e.target.value, task.time_slot_end)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Конец</label>
                  <input
                    type="time"
                    value={task.time_slot_end || ''}
                    onChange={(e) => handleTimeChange(false, task.time_slot_start, e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-3">Описание</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Checklist */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Чек-лист</h3>
            <button
              onClick={() => setEditingChecklist(!editingChecklist)}
              className="btn btn-secondary text-sm"
            >
              {editingChecklist ? 'Готово' : 'Редактировать'}
            </button>
          </div>

          {checklist.length === 0 && !editingChecklist ? (
            <p className="text-gray-500">Чек-лист пуст</p>
          ) : (
            <div className="space-y-2">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleChecklistToggle(index)}
                    className="w-4 h-4"
                  />
                  <span className={`flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                    {item.text}
                  </span>
                  {editingChecklist && (
                    <button
                      onClick={() => removeChecklistItem(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ))}

              {editingChecklist && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    className="input flex-1"
                    placeholder="Добавить пункт"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="btn btn-secondary"
                  >
                    Добавить
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Linked task */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-3">Связанная задача</h3>
          {task.linked_task_id ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-blue-600 cursor-pointer hover:underline">
                Задача #{task.linked_task_id}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Нет связанной задачи</p>
          )}
        </div>

        {/* Links (comments) */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Линки</h3>
            <button
              onClick={() => setShowAddLink(true)}
              className="btn btn-primary text-sm"
            >
              + Добавить линк
            </button>
          </div>

          {showAddLink && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <textarea
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="input mb-2"
                rows="3"
                placeholder="Введите комментарий"
              />
              <div className="flex gap-2">
                <button onClick={addLink} className="btn btn-primary">
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setShowAddLink(false);
                    setNewLink('');
                  }}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {links.length === 0 ? (
            <p className="text-gray-500">Нет линков</p>
          ) : (
            <div className="space-y-3">
              {links.map((link, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900">{link.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(parseISO(link.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteLink(index)}
                      className="text-red-600 hover:text-red-700 text-sm ml-2"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
