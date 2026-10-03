import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateTaskPage from '../pages/CreateTaskPage';
import { groupsService, prioritiesService, tasksService } from '../services/api';
import { AuthProvider } from '../contexts/AuthContext';

vi.mock('../services/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams('date=2026-09-27')],
  };
});

const mockGroups = [
  {
    id: 1,
    name: 'Рабочие задачи',
    color: '#3b82f6',
    types: [
      { id: 1, name: 'Встречи' },
      { id: 2, name: 'Разработка' },
    ],
  },
  {
    id: 2,
    name: 'Личные задачи',
    color: '#10b981',
    types: [],
  },
];

const mockPriorities = [
  { id: 1, name: 'Высокий', color: '#ef4444', level: 1 },
  { id: 2, name: 'Средний', color: '#f59e0b', level: 2 },
];

describe('CreateTaskPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    groupsService.getGroups.mockResolvedValue({ groups: mockGroups });
    prioritiesService.getPriorities.mockResolvedValue({ priorities: mockPriorities });
  });

  it('отображает выбор группы на первом шаге', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <CreateTaskPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Выберите группу записей')).toBeInTheDocument();
      expect(screen.getByText('Рабочие задачи')).toBeInTheDocument();
      expect(screen.getByText('Личные задачи')).toBeInTheDocument();
    });
  });

  it('показывает типы группы после выбора группы', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <CreateTaskPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Рабочие задачи')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Рабочие задачи'));

    await waitFor(() => {
      expect(screen.getByText('Выберите тип (опционально)')).toBeInTheDocument();
      expect(screen.getByText('Встречи')).toBeInTheDocument();
      expect(screen.getByText('Разработка')).toBeInTheDocument();
    });
  });

  it('отображает дату выполнения', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <CreateTaskPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/27 сентября 2026/)).toBeInTheDocument();
    });
  });

  it('загружает группы и приоритеты при монтировании', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <CreateTaskPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(groupsService.getGroups).toHaveBeenCalled();
      expect(prioritiesService.getPriorities).toHaveBeenCalled();
    });
  });

  it('кнопка "Продолжить" активна только после выбора группы', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <CreateTaskPage />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Продолжить →')).toBeInTheDocument();
    });

    const continueButton = screen.getByText('Продолжить →');
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByText('Рабочие задачи'));

    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
  });
});
