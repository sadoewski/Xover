import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { tasksService, groupsService, prioritiesService, eventsService } from '../services/api';
import ProfessionalLayout from '../components/ProfessionalLayout';
import ProfessionalCreateTaskModal from '../components/ProfessionalCreateTaskModal';
import StatusIcon from '../components/StatusIcon';
import WeekView from '../components/WeekView';
import MonthView from '../components/MonthView';
import YearView from '../components/YearView';
import WeekPickerModal from '../components/WeekPickerModal';
import MonthPickerModal from '../components/MonthPickerModal';
import './CalendarPageNew.css';

const STATUS_CONFIG = {
  pending: { label: 'Ожидается', color: '#6b7280' },
  in_progress: { label: 'В процессе', color: '#4a9eff' },
  completed: { label: 'Выполнено', color: '#22c55e' },
  cancelled: { label: 'Отменен', color: '#ef4444' },
  moved: { label: 'Перенесен', color: '#a855f7' },
};

export default function CalendarPageNew() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('day');
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [dayEvents, setDayEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Все события для определения выходных

  useEffect(() => {
    loadData();
  }, [selectedDate, view]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, prioritiesData, eventsData] = await Promise.all([
        groupsService.getGroups(),
        prioritiesService.getPriorities(),
        eventsService.getEvents(),
      ]);
      setGroups(groupsData.groups || []);
      setPriorities(prioritiesData.priorities || []);
      setAllEvents(eventsData.events || []);

      if (view === 'day') {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const tasksData = await tasksService.getTasksByDate(dateStr);
        setTasks(tasksData.tasks || []);
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
        const eventsData = await eventsService.getEventsByDate(month, day);
        setDayEvents(eventsData.events || []);
      } else if (view === 'week') {
        const start = startOfWeek(selectedDate, { locale: ru });
        const end = endOfWeek(selectedDate, { locale: ru });
        const days = eachDayOfInterval({ start, end });
        const tasksPromises = days.map(day =>
          tasksService.getTasksByDate(format(day, 'yyyy-MM-dd'))
            .then(data => data.tasks || [])
            .catch(() => [])
        );
        const tasksArrays = await Promise.all(tasksPromises);
        setTasks(tasksArrays.flat());
      } else if (view === 'month') {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const days = eachDayOfInterval({ start, end });
        const tasksPromises = days.map(day =>
          tasksService.getTasksByDate(format(day, 'yyyy-MM-dd'))
            .then(data => data.tasks || [])
            .catch(() => [])
        );
        const tasksArrays = await Promise.all(tasksPromises);
        setTasks(tasksArrays.flat());
      } else if (view === 'year') {
        const start = startOfYear(selectedDate);
        const end = endOfYear(selectedDate);
        const days = eachDayOfInterval({ start, end });
        const tasksPromises = days.map(day =>
          tasksService.getTasksByDate(format(day, 'yyyy-MM-dd'))
            .then(data => data.tasks || [])
            .catch(() => [])
        );
        const tasksArrays = await Promise.all(tasksPromises);
        setTasks(tasksArrays.flat());
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Проверка, является ли день выходным (суббота/воскресенье или событие с is_day_off)
  const isDayOff = (date) => {
    const dayOfWeek = date.getDay();
    // 0 = воскресенье, 6 = суббота
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Проверяем также события с is_day_off
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hasHoliday = allEvents.some(event =>
      event.month === month &&
      event.day === day &&
      event.is_day_off
    );

    return isWeekend || hasHoliday;
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

  const handleToday = () => {
    setSelectedDate(new Date());
    setView('day');
  };

  const handleCreateTask = async (taskData) => {
    try {
      await tasksService.createTask(taskData);
      await loadData();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      throw error;
    }
  };

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await tasksService.updateTask(taskId, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Удалить эту задачу?')) return;
    try {
      await tasksService.deleteTask(taskId);
      await loadData();
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const isPastDate = () => {
    const checkDate = new Date(selectedDate);
    const today = new Date();
    checkDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const getViewLabel = () => {
    if (view === 'day') return format(selectedDate, 'd MMMM yyyy, EEEE', { locale: ru });
    if (view === 'week') {
      const start = startOfWeek(selectedDate, { locale: ru });
      const end = endOfWeek(selectedDate, { locale: ru });
      return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM yyyy', { locale: ru })}`;
    }
    if (view === 'month') return format(selectedDate, 'LLLL yyyy', { locale: ru });
    if (view === 'year') return format(selectedDate, 'yyyy', { locale: ru });
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = task.date || task.created_at?.split('T')[0];
      return taskDate === format(date, 'yyyy-MM-dd');
    });
  };

  const handleDateLabelClick = () => {
    if (view === 'week') {
      setShowWeekPicker(true);
    } else if (view === 'month') {
      setShowMonthPicker(true);
    }
  };

  const handleSelectWeek = (weekStart) => {
    setSelectedDate(weekStart);
  };

  const handleSelectMonth = (month) => {
    setSelectedDate(month);
  };

  return (
    <ProfessionalLayout>
      <div className="calendar-page">
        <div className="calendar-toolbar">
          <div className="toolbar-left">
            <button className="btn-icon" onClick={handlePrevPeriod}>
              <ChevronLeft size={20} />
            </button>
            <button
              className={`btn-secondary ${format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && view === 'day' ? 'active' : ''}`}
              onClick={handleToday}
            >
              Сегодня
            </button>
            <button className="btn-icon" onClick={handleNextPeriod}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="toolbar-center">
            <CalendarIcon size={18} />
            <span
              className={`date-label ${(view === 'week' || view === 'month') ? 'clickable' : ''}`}
              onClick={handleDateLabelClick}
              style={{
                cursor: (view === 'week' || view === 'month') ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (view === 'week' || view === 'month') {
                  e.target.style.color = 'var(--color-keyword)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--color-function)';
              }}
            >
              {getViewLabel()}
              {view === 'day' && isDayOff(selectedDate) && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626'
                }}>
                  Выходной
                </span>
              )}
            </span>
          </div>

          <div className="toolbar-right">
            <div className="view-switcher">
              <button
                className={`btn-ghost btn-sm ${view === 'day' ? 'active' : ''}`}
                onClick={() => setView('day')}
              >
                День
              </button>
              <button
                className={`btn-ghost btn-sm ${view === 'week' ? 'active' : ''}`}
                onClick={() => setView('week')}
              >
                Неделя
              </button>
              <button
                className={`btn-ghost btn-sm ${view === 'month' ? 'active' : ''}`}
                onClick={() => setView('month')}
              >
                Месяц
              </button>
              <button
                className={`btn-ghost btn-sm ${view === 'year' ? 'active' : ''}`}
                onClick={() => setView('year')}
              >
                Год
              </button>
            </div>

            <button
              className="btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
              disabled={isPastDate()}
              title={isPastDate() ? 'Нельзя создавать задачи на прошедшие даты' : ''}
            >
              <Plus size={16} />
              Создать задачу
            </button>
          </div>
        </div>

        <div className="calendar-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
            </div>
          ) : view === 'day' ? (
            <>
              {dayEvents.length > 0 && (
                <div className="events-section" style={{ marginBottom: '24px' }}>
                  <h3 className="section-title" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>События дня</h3>
                  <div className="events-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="event-item"
                        style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '6px',
                          borderLeft: '3px solid',
                          borderLeftColor: event.type === 'birthday' ? '#ec4899' : '#3b82f6'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-primary)' }}>{event.name}</span>
                              <span className="event-type-badge" style={{
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: '500',
                                backgroundColor: event.type === 'birthday' ? '#fce7f3' : '#dbeafe',
                                color: event.type === 'birthday' ? '#be185d' : '#1e40af'
                              }}>
                                {event.type === 'birthday' ? 'День рождения' : 'Праздник'}
                              </span>
                              {event.is_day_off && (
                                <span className="day-off-badge" style={{
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626'
                                }}>
                                  Выходной
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{event.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tasks.length === 0 && dayEvents.length === 0 ? (
                <div className="empty-state">
                  <CalendarIcon size={48} />
                  <h3>Нет задач</h3>
                  <p>Создайте первую задачу на эту дату</p>
                </div>
              ) : tasks.length > 0 ? (
                <div className="tasks-table-container">
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Статус</th>
                      <th style={{ width: '120px' }}>Время</th>
                      <th>Название</th>
                      <th style={{ width: '150px' }}>Группа</th>
                      <th style={{ width: '120px' }}>Приоритет</th>
                      <th style={{ width: '150px' }}>Изменить статус</th>
                      <th style={{ width: '80px' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => {
                      // Определяем, продолжается ли задача на следующий день
                      const isOvernight = task.is_time_bound && task.time_slot_start && task.time_slot_end && task.time_slot_end < task.time_slot_start;
                      const isContinuation = task.is_continuation;

                      return (
                      <tr key={task.id} className={`task-row ${isOvernight || isContinuation ? 'overnight-task' : ''}`}>
                        <td style={{ textAlign: 'center' }}>
                          <StatusIcon
                            status={task.status}
                            color={STATUS_CONFIG[task.status]?.color}
                            size={20}
                          />
                        </td>
                        <td className="time-cell">
                          {task.is_time_bound && task.time_slot_start
                            ? `${task.time_slot_start.slice(0, 5)}${task.time_slot_end ? `-${task.time_slot_end.slice(0, 5)}` : ''}`
                            : 'свободная'}
                        </td>
                        <td>
                          <div className="task-title-cell" onClick={() => handleTaskClick(task.id)}>
                            {task.title}
                            {isContinuation && <span className="continuation-note"> (продолжение с {new Date(new Date(task.date).getTime() - 86400000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })})</span>}
                            {isOvernight && !isContinuation && <span className="continuation-note"> (продолжается на следующий день)</span>}
                            {task.task_relations && task.task_relations.length > 0 && (
                              <span className="relations-badge" title={`${task.task_relations.length} связей`}>
                                {task.task_relations.length}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <div className="task-description-cell">{task.description}</div>
                          )}
                        </td>
                        <td>
                          <span
                            className="group-badge"
                            style={{ backgroundColor: task.group_color }}
                          >
                            {task.group_name}
                          </span>
                        </td>
                        <td>
                          <span
                            className="priority-badge"
                            style={{ backgroundColor: task.priority_color }}
                          >
                            {task.priority_name}
                          </span>
                        </td>
                        <td>
                          <select
                            className="status-select"
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                            disabled={['completed', 'cancelled'].includes(task.status)}
                          >
                            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                              <option key={value} value={value}>
                                {config.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDeleteTask(task.id)}
                            title="Удалить"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              ) : null}
            </>
          ) : view === 'week' ? (
            <WeekView
              selectedDate={selectedDate}
              tasks={tasks}
              isDayOff={isDayOff}
              onDayClick={(date) => { setSelectedDate(date); setView('day'); }}
            />
          ) : view === 'month' ? (
            <MonthView
              selectedDate={selectedDate}
              tasks={tasks}
              isDayOff={isDayOff}
              onWeekClick={(date) => { setSelectedDate(date); setView('day'); }}
            />
          ) : view === 'year' ? (
            <YearView
              selectedDate={selectedDate}
              tasks={tasks}
              isDayOff={isDayOff}
              onMonthClick={(date) => { setSelectedDate(date); setView('month'); }}
            />
          ) : null}
        </div>
      </div>

      {showCreateModal && (
        <ProfessionalCreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateTask={handleCreateTask}
          groups={groups}
          priorities={priorities}
          selectedDate={selectedDate}
        />
      )}

      <WeekPickerModal
        isOpen={showWeekPicker}
        onClose={() => setShowWeekPicker(false)}
        selectedDate={selectedDate}
        onSelectWeek={handleSelectWeek}
      />

      <MonthPickerModal
        isOpen={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        selectedDate={selectedDate}
        onSelectMonth={handleSelectMonth}
      />
    </ProfessionalLayout>
  );
}
