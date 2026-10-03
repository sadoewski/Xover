import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GroupsPage from '../pages/GroupsPage';
import { groupsService, tasksService } from '../services/api';
import { AuthProvider } from '../contexts/AuthContext';

vi.mock('../services/api');

const mockGroups = [
  {
    id: 1,
    name: 'Рабочие задачи',
    color: '#3b82f6',
    description: 'Задачи по работе',
    types: [
      { id: 1, name: 'Встречи', description: 'Рабочие встречи' },
      { id: 2, name: 'Разработка', description: 'Задачи разработки' },
    ],
  },
  {
    id: 2,
    name: 'Личные задачи',
    color: '#10b981',
    description: 'Личные дела',
    types: [],
  },
];

const mockTasks = [
  { id: 1, title: 'Задача 1', group_id: 1, group_type_id: 1, scheduled_date: '2026-09-27' },
  { id: 2, title: 'Задача 2', group_id: 1, scheduled_date: '2026-09-28' },
];

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокаем все возможные вызовы getTasksByDate
    tasksService.getTasksByDate = vi.fn().mockResolvedValue({ tasks: [] });
  });

  it('отображает список групп', async () => {
    groupsService.getGroups.mockResolvedValue({ groups: mockGroups });
    groupsService.getTypes.mockResolvedValue({ types: [] });

    render(
      <AuthProvider>
        <BrowserRouter>
          <GroupsPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Рабочие задачи')).toBeInTheDocument();
      expect(screen.getByText('Личные задачи')).toBeInTheDocument();
    });
  });

  it('показывает сообщение когда групп нет', async () => {
    groupsService.getGroups.mockResolvedValue({ groups: [] });
    groupsService.getTypes.mockResolvedValue({ types: [] });

    render(
      <AuthProvider>
        <BrowserRouter>
          <GroupsPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Нет групп')).toBeInTheDocument();
    });
  });

  it('вызывает API для получения групп при загрузке', async () => {
    groupsService.getGroups.mockResolvedValue({ groups: mockGroups });
    groupsService.getTypes.mockResolvedValue({ types: [] });

    render(
      <AuthProvider>
        <BrowserRouter>
          <GroupsPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(groupsService.getGroups).toHaveBeenCalledTimes(1);
    });
  });

  it('отображает количество типов и задач в группе', async () => {
    groupsService.getGroups.mockResolvedValue({ groups: mockGroups });
    groupsService.getTypes.mockResolvedValue({
      types: [
        { id: 1, name: 'Встречи', group_id: 1 },
        { id: 2, name: 'Разработка', group_id: 1 },
      ],
    });
    tasksService.getTasksByDate.mockResolvedValue({ tasks: mockTasks });

    render(
      <AuthProvider>
        <BrowserRouter>
          <GroupsPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 типов/)).toBeInTheDocument();
    });
  });

  it('обрабатывает ошибку при загрузке групп', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    groupsService.getGroups.mockRejectedValue(new Error('Ошибка сервера'));

    render(
      <AuthProvider>
        <BrowserRouter>
          <GroupsPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
