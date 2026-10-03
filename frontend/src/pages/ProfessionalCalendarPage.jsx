import React, { useState, useEffect } from 'react';
import { format, addDays, addWeeks, addMonths, addYears, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Grid3x3,
  List,
  Clock,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { tasksService, groupsService, prioritiesService } from '../services/api';
import ProfessionalLayout from '../components/ProfessionalLayout';
import ProfessionalTaskCard from '../components/ProfessionalTaskCard';
import ProfessionalCreateTaskModal from '../components/ProfessionalCreateTaskModal';
import './ProfessionalCalendarPage.css';

const ProfessionalCalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('day'); // 'day', 'week', 'month', 'year'
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const [tasksData, groupsData, prioritiesData] = await Promise.all([
        tasksService.getTasksByDate(dateStr),
        groupsService.getGroups(),
        prioritiesService.getPriorities(),
      ]);
      setTasks(tasksData.tasks || []);
      setGroups(groupsData.groups || []);
      setPriorities(prioritiesData.priorities || []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
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

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await tasksService.updateTask(taskId, updates);
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
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

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (filterGroup !== 'all' && task.group_id !== parseInt(filterGroup)) return false;
      if (filterPriority !== 'all' && task.priority_id !== parseInt(filterPriority)) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="mini-calendar">
        <div className="mini-calendar-header">
          <button className="btn-icon" onClick={() => setSelectedDate(addMonths(selectedDate, -1))}>
            <ChevronLeft size={16} />
          </button>
          <span className="mini-calendar-title">
            {format(selectedDate, 'LLLL yyyy', { locale: ru })}
          </span>
          <button className="btn-icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mini-calendar-weekdays">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="mini-calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="mini-calendar-days">
          {calendarDays.map(day => (
            <button
              key={day.toString()}
              className={`mini-calendar-day ${isSameDay(day, selectedDate) ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              {format(day, 'd')}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProfessionalLayout>
      <div className="professional-calendar">
        {/* Left Panel - Mini Calendar & Filters */}
        <div className="calendar-left-panel">
          {renderMiniCalendar()}

          <div className="filters-section">
            <div className="section-header">
              <Filter size={16} />
              <span>Фильтры</span>
            </div>

            <div className="filter-group">
              <label className="filter-label">Группа</label>
              <select
                className="select"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="all">Все группы</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Приоритет</label>
              <select
                className="select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">Все приоритеты</option>
                {priorities.map(priority => (
                  <option key={priority.id} value={priority.id}>{priority.name}</option>
                ))}
              </select>
            </div>

            {(filterGroup !== 'all' || filterPriority !== 'all') && (
              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  setFilterGroup('all');
                  setFilterPriority('all');
                }}
              >
                <X size={14} />
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>

        {/* Center Panel - Task List */}
        <div className="calendar-center-panel">
          <div className="panel-toolbar">
            <div className="toolbar-section">
              <button className="btn-icon" onClick={handlePrevPeriod}>
                <ChevronLeft size={20} />
              </button>
              <button className="btn-secondary" onClick={handleToday}>
                Сегодня
              </button>
              <button className="btn-icon" onClick={handleNextPeriod}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="date-display">
              <CalendarIcon size={18} />
              <span className="date-text">
                {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: ru })}
              </span>
            </div>

            <div className="toolbar-section">
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
              </div>

              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
                disabled={isPastDate()}
                title={isPastDate() ? 'Нельзя создавать задачи на прошедшие даты' : ''}
              >
                <Plus size={16} />
                Создать задачу
              </button>
            </div>
          </div>

          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="btn-icon" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="tasks-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>Загрузка задач...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <CalendarIcon size={48} />
                <h3>Нет задач</h3>
                <p>Создайте первую задачу на эту дату</p>
              </div>
            ) : (
              <div className="tasks-list">
                {filteredTasks.map(task => (
                  <ProfessionalTaskCard
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onClick={() => setSelectedTask(task)}
                    isSelected={selectedTask?.id === task.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Task Details */}
        <div className="calendar-right-panel">
          {selectedTask ? (
            <div className="task-details-panel">
              <div className="panel-header">
                <h3>Детали задачи</h3>
                <button className="btn-icon" onClick={() => setSelectedTask(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="task-details-content">
                <h2>{selectedTask.title}</h2>
                <p>{selectedTask.description || 'Нет описания'}</p>
                {/* Добавим полный просмотр позже */}
              </div>
            </div>
          ) : (
            <div className="no-selection-state">
              <List size={48} />
              <h3>Выберите задачу</h3>
              <p>Выберите задачу из списка для просмотра деталей</p>
            </div>
          )}
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
    </ProfessionalLayout>
  );
};

export default ProfessionalCalendarPage;
