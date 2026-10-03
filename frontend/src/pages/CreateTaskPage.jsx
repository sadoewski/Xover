import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { tasksService, groupsService, prioritiesService } from '../services/api';

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');

  const [step, setStep] = useState('group'); // group, details
  const [groups, setGroups] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [groupTypes, setGroupTypes] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority_id: '',
    scheduled_date: date || '',
    time_slot_start: null,
    time_slot_end: null,
    is_free_time: true,
    enable_checklist: false,
    enable_link: false,
    linked_task_id: null,
  });

  const [checklist, setChecklist] = useState([]);
  const [checklistInput, setChecklistInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      const types = selectedGroup.types || [];
      setGroupTypes(types);
    }
  }, [selectedGroup]);

  const loadData = async () => {
    try {
      const [groupsData, prioritiesData] = await Promise.all([
        groupsService.getGroups(),
        prioritiesService.getPriorities(),
      ]);
      setGroups(groupsData.groups);
      setPriorities(prioritiesData.priorities);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedType(null);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const handleProceedToDetails = () => {
    if (!selectedGroup) {
      alert('Выберите группу');
      return;
    }
    setStep('details');
  };

  const addChecklistItem = () => {
    if (checklistInput.trim()) {
      setChecklist([...checklist, { text: checklistInput, checked: false }]);
      setChecklistInput('');
    }
  };

  const removeChecklistItem = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const taskData = {
        groupId: selectedGroup.id,
        groupTypeId: selectedType?.id || null,
        priorityId: formData.priority_id,
        title: formData.title,
        description: formData.description || null,
        date: date,
        timeSlotStart: formData.is_free_time ? null : formData.time_slot_start,
        timeSlotEnd: formData.is_free_time ? null : formData.time_slot_end,
        isTimeBound: !formData.is_free_time,
        checklist: formData.enable_checklist ? checklist : [],
      };

      const result = await tasksService.createTask(taskData);
      navigate(`/calendar?date=${date}`);
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      console.error('Детали ошибки:', error.response?.data);
      alert('Ошибка создания задачи: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (step === 'group') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Создание задачи</h1>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Отмена
            </button>
          </div>

          <div className="card mb-6">
            <div className="text-sm text-gray-600 mb-4">
              Дата выполнения: {date ? format(parseISO(date), 'd MMMM yyyy', { locale: ru }) : 'Не указана'}
            </div>
          </div>

          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Выберите группу записей</h2>
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedGroup?.id === group.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleGroupSelect(group)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium text-gray-900">{group.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedGroup && groupTypes.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Выберите тип (опционально)</h2>
              <div className="space-y-2">
                {groupTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedType?.id === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTypeSelect(type)}
                  >
                    <span className="font-medium text-gray-900">{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleProceedToDetails}
              className="btn btn-primary"
              disabled={!selectedGroup}
            >
              Продолжить →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Details form
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Создание задачи</h1>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Отмена
          </button>
        </div>

        <div className="card mb-6">
          <div className="space-y-2 text-sm">
            <div><strong>Дата выполнения:</strong> {format(parseISO(date), 'd MMMM yyyy', { locale: ru })}</div>
            <div><strong>Группа:</strong> {selectedGroup.name}</div>
            {selectedType && <div><strong>Тип:</strong> {selectedType.name}</div>}
            <button
              onClick={() => setStep('group')}
              className="text-blue-600 hover:text-blue-700 text-sm mt-2"
            >
              ← Изменить группу/тип
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название задачи */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название задачи *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              required
              placeholder="Введите название"
            />
          </div>

          {/* Приоритет */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Приоритет *
            </label>
            <select
              required
              className="input"
              value={formData.priority_id}
              onChange={(e) => setFormData({ ...formData, priority_id: e.target.value })}
            >
              <option value="">Выберите приоритет</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>

          {/* Привязка ко времени */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Привязка ко времени
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="time_binding"
                  checked={formData.is_free_time}
                  onChange={() => setFormData({ ...formData, is_free_time: true, time_slot_start: null, time_slot_end: null })}
                  className="w-4 h-4"
                />
                <span>Свободное выполнение</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="time_binding"
                  checked={!formData.is_free_time}
                  onChange={() => setFormData({ ...formData, is_free_time: false })}
                  className="w-4 h-4"
                />
                <span>Тайм-слот</span>
              </label>

              {!formData.is_free_time && (
                <div className="mt-3 grid grid-cols-2 gap-3 pl-6">
                  <div>
                    <label htmlFor="time_start" className="block text-xs text-gray-600 mb-1">Начало</label>
                    <input
                      id="time_start"
                      type="time"
                      value={formData.time_slot_start || ''}
                      onChange={(e) => setFormData({ ...formData, time_slot_start: e.target.value })}
                      className="input"
                      required={!formData.is_free_time}
                    />
                  </div>
                  <div>
                    <label htmlFor="time_end" className="block text-xs text-gray-600 mb-1">Конец</label>
                    <input
                      id="time_end"
                      type="time"
                      value={formData.time_slot_end || ''}
                      onChange={(e) => setFormData({ ...formData, time_slot_end: e.target.value })}
                      className="input"
                      required={!formData.is_free_time}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Описание */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание (опционально)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="4"
              placeholder="Добавьте описание задачи"
            />
          </div>

          {/* Дополнительные настройки */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Дополнительные настройки</h3>

            {/* Список (чек-лист) */}
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-3">
                <input
                  id="enable_checklist"
                  type="checkbox"
                  checked={formData.enable_checklist}
                  onChange={(e) => setFormData({ ...formData, enable_checklist: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="font-medium">Список (чек-лист)</span>
              </label>

              {formData.enable_checklist && (
                <div className="pl-6 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={checklistInput}
                      onChange={(e) => setChecklistInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                      className="input flex-1"
                      placeholder="Добавить пункт"
                    />
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      className="btn btn-secondary"
                    >
                      + Добавить
                    </button>
                  </div>

                  {checklist.length > 0 && (
                    <div className="space-y-2">
                      {checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="flex-1">{item.text}</span>
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Связь с задачей */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  id="enable_link"
                  type="checkbox"
                  checked={formData.enable_link}
                  onChange={(e) => setFormData({ ...formData, enable_link: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="font-medium">Связь с другой задачей</span>
              </label>

              {formData.enable_link && (
                <div className="pl-6 mt-3">
                  <p className="text-sm text-gray-600">
                    Связанную задачу можно будет выбрать после создания
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setStep('group')}
              className="btn btn-secondary"
            >
              ← Назад
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !formData.title || !formData.priority_id}
            >
              {saving ? 'Создание...' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

