import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { tasksService } from '../services/api';

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  groups,
  priorities,
  selectedDate,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    groupId: '',
    groupTypeId: '',
    priorityId: '',
    isTimeBound: false,
    timeSlotStart: '',
    timeSlotEnd: '',
    taskRelations: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedGroup = groups.find(g => g.id === parseInt(formData.groupId));
  const groupTypes = selectedGroup?.types || [];

  useEffect(() => {
    if (isOpen && showTaskSelector) {
      loadAvailableTasks();
    }
  }, [isOpen, showTaskSelector]);

  const loadAvailableTasks = async () => {
    try {
      const response = await tasksService.getTasksByDate(format(new Date(), 'yyyy-MM-dd'));
      setAvailableTasks(response.tasks || []);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Валидация даты - запрет создания задач на прошедшие даты
      const taskDate = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate < today) {
        setError('Нельзя создавать задачи на прошедшие даты');
        setLoading(false);
        return;
      }

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        groupId: parseInt(formData.groupId),
        groupTypeId: formData.groupTypeId ? parseInt(formData.groupTypeId) : null,
        priorityId: parseInt(formData.priorityId),
        date: format(selectedDate, 'yyyy-MM-dd'),
        isTimeBound: formData.isTimeBound,
        timeSlotStart: formData.isTimeBound ? formData.timeSlotStart : null,
        timeSlotEnd: formData.isTimeBound ? formData.timeSlotEnd : null,
        taskRelations: formData.taskRelations.length > 0 ? formData.taskRelations : undefined,
      };

      await onCreateTask(taskData);

      // Сброс формы
      setFormData({
        title: '',
        description: '',
        groupId: '',
        groupTypeId: '',
        priorityId: '',
        isTimeBound: false,
        timeSlotStart: '',
        timeSlotEnd: '',
        taskRelations: [],
      });
      setShowTaskSelector(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания записи');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskRelation = (taskId) => {
    setFormData(prev => {
      const relations = prev.taskRelations.includes(taskId)
        ? prev.taskRelations.filter(id => id !== taskId)
        : [...prev.taskRelations, taskId];
      return { ...prev, taskRelations: relations };
    });
  };

  const filteredTasks = availableTasks.filter(task =>
    searchQuery ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  Создать запись
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Название */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  {/* Группа */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Группа *
                    </label>
                    <select
                      required
                      className="input"
                      value={formData.groupId}
                      onChange={(e) => setFormData({ ...formData, groupId: e.target.value, groupTypeId: '' })}
                    >
                      <option value="">Выберите группу</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Вид группы */}
                  {groupTypes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Вид (необязательно)
                      </label>
                      <select
                        className="input"
                        value={formData.groupTypeId}
                        onChange={(e) => setFormData({ ...formData, groupTypeId: e.target.value })}
                      >
                        <option value="">Не выбрано</option>
                        {groupTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Приоритет */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Приоритет *
                    </label>
                    <select
                      required
                      className="input"
                      value={formData.priorityId}
                      onChange={(e) => setFormData({ ...formData, priorityId: e.target.value })}
                    >
                      <option value="">Выберите приоритет</option>
                      {priorities.map((priority) => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Описание */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Привязка ко времени */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isTimeBound}
                        onChange={(e) => setFormData({ ...formData, isTimeBound: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Привязать ко времени
                      </span>
                    </label>
                  </div>

                  {/* Временные слоты */}
                  {formData.isTimeBound && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Начало
                        </label>
                        <input
                          type="time"
                          required
                          className="input"
                          value={formData.timeSlotStart}
                          onChange={(e) => setFormData({ ...formData, timeSlotStart: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Конец
                        </label>
                        <input
                          type="time"
                          className="input"
                          value={formData.timeSlotEnd}
                          onChange={(e) => setFormData({ ...formData, timeSlotEnd: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Связанные задачи */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Связанные задачи
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTaskSelector(!showTaskSelector)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {showTaskSelector ? 'Скрыть' : 'Выбрать задачи'}
                      </button>
                    </div>

                    {formData.taskRelations.length > 0 && (
                      <div className="mb-2 text-sm text-gray-600">
                        Выбрано задач: {formData.taskRelations.length}
                      </div>
                    )}

                    {showTaskSelector && (
                      <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          placeholder="Поиск задачи..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input mb-2"
                        />

                        {filteredTasks.length === 0 ? (
                          <div className="text-sm text-gray-500 text-center py-4">
                            Задачи не найдены
                          </div>
                        ) : (
                          filteredTasks.map(task => (
                            <label key={task.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.taskRelations.includes(task.id)}
                                onChange={() => toggleTaskRelation(task.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className="text-xs px-2 py-0.5 rounded text-white"
                                    style={{ backgroundColor: task.group_color }}
                                  >
                                    {task.group_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(task.date), 'd MMM', { locale: ru })}
                                  </span>
                                </div>
                                <div className="font-medium text-gray-900">{task.title}</div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary flex-1"
                    >
                      {loading ? 'Создание...' : 'Создать'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-secondary"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
