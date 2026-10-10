import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, addMonths, addYears, startOfMonth, endOfMonth, eachWeekOfInterval, startOfYear, endOfYear, eachMonthOfInterval, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { tasksService, groupsService, prioritiesService, eventsService } from '../services/api';
import TaskList from '../components/TaskList';
import CreateTaskModal from '../components/CreateTaskModal';
import Layout from '../components/Layout';
import XoverSidebar from '../components/XoverSidebar';
import StatusIcon from '../components/StatusIcon';

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('day'); // day, week, month, year
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // Для отображения меток на календаре
  const [dayEvents, setDayEvents] = useState([]); // События для выбранного дня
  const [allEvents, setAllEvents] = useState([]); // Все события для отображения в календаре
  const [groups, setGroups] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (view === 'day') {
      loadTasksForDate(selectedDate);
    } else {
      loadTasksForPeriod();
    }
  }, [selectedDate, view]);

  const loadInitialData = async () => {
    try {
      const [groupsData, prioritiesData, eventsData] = await Promise.all([
        groupsService.getGroups(),
        prioritiesService.getPriorities(),
        eventsService.getEvents(),
      ]);
      setGroups(groupsData.groups);
      setPriorities(prioritiesData.priorities);
      setAllEvents(eventsData.events);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const loadEventsForDate = async (date) => {
    try {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const data = await eventsService.getEventsByDate(month, day);
      const events = data.events || [];
      setDayEvents(events);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
      setDayEvents([]);
    }
  };

  const loadTasksForDate = async (date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');

      const data = await tasksService.getTasksByDate(dateStr);
      setTasks(data.tasks);

      // Загружаем события для этого дня
      await loadEventsForDate(date);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasksForPeriod = async () => {
    setLoading(true);
    try {
      let start, end;

      if (view === 'week') {
        start = startOfWeek(selectedDate, { locale: ru });
        end = endOfWeek(selectedDate, { locale: ru });
      } else if (view === 'month') {
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
      } else if (view === 'year') {
        start = startOfYear(selectedDate);
        end = endOfYear(selectedDate);
      }

      // Загружаем все задачи за период
      const days = eachDayOfInterval({ start, end });
      const tasksPromises = days.map(day =>
        tasksService.getTasksByDate(format(day, 'yyyy-MM-dd'))
          .then(data => ({ date: format(day, 'yyyy-MM-dd'), tasks: data.tasks }))
          .catch(() => ({ date: format(day, 'yyyy-MM-dd'), tasks: [] }))
      );

      const tasksData = await Promise.all(tasksPromises);
      setAllTasks(tasksData);
    } catch (error) {
      console.error('Ошибка загрузки задач за период:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await tasksService.createTask(taskData);
      if (view === 'day') {
        await loadTasksForDate(selectedDate);
      } else {
        await loadTasksForPeriod();
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Ошибка создания записи:', error);
      throw error;
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      await tasksService.updateTask(id, updates);
      if (view === 'day') {
        await loadTasksForDate(selectedDate);
      } else {
        await loadTasksForPeriod();
      }
    } catch (error) {
      console.error('Ошибка обновления записи:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await tasksService.deleteTask(id);
      if (view === 'day') {
        await loadTasksForDate(selectedDate);
      } else {
        await loadTasksForPeriod();
      }
    } catch (error) {
      console.error('Ошибка удаления записи:', error);
    }
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setView('day');
  };

  const handleWeekClick = (weekStart) => {
    setSelectedDate(weekStart);
    setView('week');
  };

  const handleMonthClick = (monthStart) => {
    setSelectedDate(monthStart);
    setView('month');
  };

  const handlePrevPeriod = () => {
    if (view === 'day') setSelectedDate(addDays(selectedDate, -1));
    if (view === 'week') setSelectedDate(addWeeks(selectedDate, -1));
    if (view === 'month') setSelectedDate(addMonths(selectedDate, -1));
    if (view === 'year') setSelectedDate(addYears(selectedDate, -1));
  };

  const handleNextPeriod = () => {
    if (view === 'day') setSelectedDate(addDays(selectedDate, 1));
    if (view === 'week') setSelectedDate(addWeeks(selectedDate, 1));
    if (view === 'month') setSelectedDate(addMonths(selectedDate, 1));
    if (view === 'year') setSelectedDate(addYears(selectedDate, 1));
  };

  const getTasksForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTasks = allTasks.find(d => d.date === dateStr);
    return dayTasks ? dayTasks.tasks : [];
  };

  const hasTasksOnDate = (date) => {
    const dayTasks = getTasksForDate(date);
    return dayTasks.length > 0;
  };

  const getDateMarker = (date) => {
    const dayTasks = getTasksForDate(date);
    if (dayTasks.length === 0) return null;

    // Берем первый приоритет задач дня
    const firstTask = dayTasks[0];
    return firstTask.priority_color;
  };

  const isToday = isSameDay(selectedDate, new Date());

  // Статистика по статусам
  const statusStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
    moved: tasks.filter(t => t.status === 'moved').length,
  };

  const completedCount = statusStats.completed;
  const totalCount = statusStats.total;

  // Проверка на прошедшую дату
  const isPastDate = () => {
    const checkDate = new Date(selectedDate);
    const today = new Date();
    checkDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Render для вида "День"
  const renderDayView = () => (
    <div className="space-y-6">
      {/* Заголовок с датой и статистикой */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Предыдущий день"
            >
              ←
            </button>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Следующий день"
            >
              →
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isToday ? `Сегодня, ${format(selectedDate, 'd MMMM yyyy', { locale: ru })}` : format(selectedDate, 'd MMMM yyyy', { locale: ru })}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span className="font-semibold">Всего: {statusStats.total}</span>
              <span>Ожидается: {statusStats.pending}</span>
              <span>В процессе: {statusStats.in_progress}</span>
              <span className="text-green-600">Выполнено: {statusStats.completed}</span>
              <span className="text-red-600">Отменено: {statusStats.cancelled}</span>
              <span className="text-orange-600">Перенесено: {statusStats.moved}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'day'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              День
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Неделя
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            disabled={groups.length === 0 || priorities.length === 0 || isPastDate()}
            title={isPastDate() ? 'Нельзя создавать задачи на прошедшие даты' : ''}
          >
            Создать запись
          </button>
        </div>
      </div>

      {(groups.length === 0 || priorities.length === 0) && (
        <p className="text-sm text-gray-600">
          Сначала создайте группы и приоритеты
        </p>
      )}

      {/* Загрузка */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Загрузка...</div>
        </div>
      ) : (
        <>
          {/* Блок событий - ВЫШЕ списка задач */}
          {dayEvents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🎉 События дня</h2>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="card p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4"
                    style={{ borderLeftColor: event.type === 'birthday' ? '#ec4899' : '#3b82f6' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{event.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              event.type === 'birthday'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {event.type === 'birthday' ? 'День рождения' : 'Праздник'}
                            </span>
                            {event.is_day_off && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                Выходной
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/events')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Управление →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Список задач */}
          <TaskList
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        </>
      )}
    </div>
  );

  // Render для вида "Неделя"
  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { locale: ru });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(selectedDate, { locale: ru }),
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={handlePrevPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Предыдущая неделя"
              >
                ←
              </button>
              <button
                onClick={handleNextPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Следующая неделя"
              >
                →
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Неделя {format(weekStart, 'd MMMM', { locale: ru })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: ru })}
            </h1>
          </div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'year'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Год
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {weekDays.map((day) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentDay = isSameDay(day, new Date());
            const isWeekend = day.getDay() === 0 || day.getDay() === 6; // 0 = воскресенье, 6 = суббота

            return (
              <div
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: isCurrentDay ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  backgroundColor: isCurrentDay ? '#eff6ff' : (isWeekend ? '#fef2f2' : 'white'),
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '12px', color: isWeekend ? '#dc2626' : '#6b7280', marginBottom: '4px', fontWeight: isWeekend ? '600' : '400' }}>
                  {format(day, 'EEEE', { locale: ru })}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: isWeekend ? '#dc2626' : '#111827', marginBottom: '8px' }}>
                  {format(day, 'd')}
                </div>
                {dayTasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayTasks.map((task, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          padding: '4px',
                          borderRadius: '4px',
                          backgroundColor: '#f9fafb'
                        }}
                      >
                        <StatusIcon status={task.status} color={task.status_color} size={12} />
                        <span
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: task.status_color || '#374151',
                            fontWeight: '500'
                          }}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render для вида "Месяц"
  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { locale: ru });
    const calendarEnd = endOfWeek(monthEnd, { locale: ru });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={handlePrevPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Предыдущий месяц"
              >
                ←
              </button>
              <button
                onClick={handleNextPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Следующий месяц"
              >
                →
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {format(selectedDate, 'LLLL yyyy', { locale: ru })}
            </h1>
          </div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'year'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Год
            </button>
          </div>
        </div>

        <div>
          {/* Заголовки дней недели */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => {
              const isWeekend = idx === 5 || idx === 6; // Сб и Вс
              return (
                <div key={day} style={{ textAlign: 'center', fontSize: '14px', fontWeight: '500', color: isWeekend ? '#dc2626' : '#6b7280' }}>
                  {day}
                </div>
              );
            })}
          </div>

          {/* Календарная сетка */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {calendarDays.map((day) => {
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isCurrentDay = isSameDay(day, new Date());
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const dayTasks = getTasksForDate(day);

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  style={{
                    minHeight: '100px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: isCurrentDay ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: isCurrentDay ? '#eff6ff' : (isWeekend && isCurrentMonth ? '#fef2f2' : (isCurrentMonth ? 'white' : '#f9fafb')),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isCurrentMonth ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (isCurrentMonth) {
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: isWeekend ? '#dc2626' : '#111827', marginBottom: '6px' }}>
                    {format(day, 'd')}
                  </div>
                  {dayTasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {dayTasks.map((task, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            padding: '3px',
                            borderRadius: '3px',
                            backgroundColor: '#f3f4f6'
                          }}
                        >
                          <StatusIcon status={task.status} color={task.status_color} size={10} />
                          <span
                            style={{
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: task.status_color || '#374151',
                              fontWeight: '500'
                            }}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render для вида "Год"
  const renderYearView = () => {
    const yearStart = startOfYear(selectedDate);
    const months = eachMonthOfInterval({
      start: yearStart,
      end: endOfYear(selectedDate),
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={handlePrevPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Предыдущий год"
              >
                ←
              </button>
              <button
                onClick={handleNextPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Следующий год"
              >
                →
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {format(selectedDate, 'yyyy')} год
            </h1>
          </div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'year'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Год
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {months.map((month) => {
            const monthDays = eachDayOfInterval({
              start: startOfMonth(month),
              end: endOfMonth(month),
            });
            const hasMarkedDays = monthDays.some((day) => hasTasksOnDate(day));

            return (
              <button
                key={month.toString()}
                onClick={() => handleMonthClick(month)}
                className={`p-6 rounded-lg border-2 hover:shadow-md transition-shadow ${
                  hasMarkedDays
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xl font-bold text-gray-900">
                  {format(month, 'LLLL', { locale: ru })}
                </div>
                {hasMarkedDays && (
                  <div className="mt-2 text-sm text-gray-600">
                    Есть задачи
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <XoverSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {loading && view !== 'day' ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Загрузка...</div>
            </div>
          ) : (
            <>
              {view === 'day' && renderDayView()}
              {view === 'week' && renderWeekView()}
              {view === 'month' && renderMonthView()}
              {view === 'year' && renderYearView()}
            </>
          )}

          {/* Модальное окно создания записи */}
          <CreateTaskModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreateTask={handleCreateTask}
            groups={groups}
            priorities={priorities}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </Layout>
  );
}

