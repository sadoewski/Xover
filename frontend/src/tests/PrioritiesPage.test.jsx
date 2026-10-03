import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PrioritiesPage from '../pages/PrioritiesPage';
import { prioritiesService } from '../services/api';
import { AuthProvider } from '../contexts/AuthContext';

vi.mock('../services/api');

const mockPriorities = [
  {
    id: 1,
    name: 'Высокий',
    color: '#ef4444',
    description: 'Срочные задачи',
    level: 1,
  },
  {
    id: 2,
    name: 'Средний',
    color: '#f59e0b',
    description: 'Обычные задачи',
    level: 2,
  },
  {
    id: 3,
    name: 'Низкий',
    color: '#10b981',
    description: 'Несрочные задачи',
    level: 3,
  },
];

describe('PrioritiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает список приоритетов', async () => {
    prioritiesService.getPriorities.mockResolvedValue({ priorities: mockPriorities });

    render(
      <AuthProvider>
        <BrowserRouter>
          <PrioritiesPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Высокий')).toBeInTheDocument();
      expect(screen.getByText('Средний')).toBeInTheDocument();
      expect(screen.getByText('Низкий')).toBeInTheDocument();
    });
  });

  it('показывает сообщение когда приоритетов нет', async () => {
    prioritiesService.getPriorities.mockResolvedValue({ priorities: [] });

    render(
      <AuthProvider>
        <BrowserRouter>
          <PrioritiesPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Нет приоритетов')).toBeInTheDocument();
    });
  });

  it('вызывает API для получения приоритетов при загрузке', async () => {
    prioritiesService.getPriorities.mockResolvedValue({ priorities: mockPriorities });

    render(
      <AuthProvider>
        <BrowserRouter>
          <PrioritiesPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(prioritiesService.getPriorities).toHaveBeenCalledTimes(1);
    });
  });

  it('отображает уровни приоритетов', async () => {
    prioritiesService.getPriorities.mockResolvedValue({ priorities: mockPriorities });

    render(
      <AuthProvider>
        <BrowserRouter>
          <PrioritiesPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Уровень 1')).toBeInTheDocument();
      expect(screen.getByText('Уровень 2')).toBeInTheDocument();
    });
  });

  it('обрабатывает ошибку при загрузке приоритетов', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    prioritiesService.getPriorities.mockRejectedValue(new Error('Ошибка сервера'));

    render(
      <AuthProvider>
        <BrowserRouter>
          <PrioritiesPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
