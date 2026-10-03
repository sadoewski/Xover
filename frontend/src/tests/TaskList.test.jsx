import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import TaskList from '../components/TaskList';

describe('TaskList', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Тестовая задача 1',
      description: 'Описание задачи',
      status: 'pending',
      priority_color: '#3B82F6',
      group_name: 'Работа',
      group_color: '#10B981',
      scheduled_date: '2026-09-27',
      is_time_bound: true,
      time_slot_start: '10:00:00',
      time_slot_end: '11:00:00',
    },
    {
      id: 2,
      title: 'Тестовая задача 2',
      description: '',
      status: 'completed',
      priority_color: '#EF4444',
      group_name: 'Личное',
      group_color: '#F59E0B',
      scheduled_date: '2026-09-27',
      is_time_bound: false,
    },
  ];

  const mockOnUpdateTask = vi.fn();
  const mockOnDeleteTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает список задач', () => {
    render(
      <BrowserRouter>
        <TaskList
          tasks={mockTasks}
          onUpdateTask={mockOnUpdateTask}
          onDeleteTask={mockOnDeleteTask}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Тестовая задача 1')).toBeInTheDocument();
    expect(screen.getByText('Тестовая задача 2')).toBeInTheDocument();
    expect(screen.getByText('Описание задачи')).toBeInTheDocument();
  });

  it('отображает информацию о группах и времени', () => {
    render(
      <BrowserRouter>
        <TaskList
          tasks={mockTasks}
          onUpdateTask={mockOnUpdateTask}
          onDeleteTask={mockOnDeleteTask}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Работа')).toBeInTheDocument();
    expect(screen.getByText('Личное')).toBeInTheDocument();
    expect(screen.getByText(/10:00 - 11:00/)).toBeInTheDocument();
  });

  it('показывает сообщение при отсутствии задач', () => {
    render(
      <BrowserRouter>
        <TaskList
          tasks={[]}
          onUpdateTask={mockOnUpdateTask}
          onDeleteTask={mockOnDeleteTask}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/нет записей на этот день/i)).toBeInTheDocument();
  });

  it('отображает правильные статусы задач', () => {
    render(
      <BrowserRouter>
        <TaskList
          tasks={mockTasks}
          onUpdateTask={mockOnUpdateTask}
          onDeleteTask={mockOnDeleteTask}
        />
      </BrowserRouter>
    );

    // Используем getAllByText для множественных вхождений
    const pendingStatuses = screen.getAllByText(/ожидается/i);
    expect(pendingStatuses.length).toBeGreaterThan(0);

    // Выполненная задача - может быть только одна
    const completedStatuses = screen.getAllByText(/выполнено/i);
    expect(completedStatuses.length).toBeGreaterThan(0);
  });

  it('отображает кнопки действий для каждой задачи', () => {
    render(
      <BrowserRouter>
        <TaskList
          tasks={mockTasks}
          onUpdateTask={mockOnUpdateTask}
          onDeleteTask={mockOnDeleteTask}
        />
      </BrowserRouter>
    );

    // Проверяем наличие селектов статусов (по количеству задач)
    const statusSelects = screen.getAllByRole('combobox');
    expect(statusSelects).toHaveLength(mockTasks.length);
  });
});
