import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import TaskDetailPage from '../pages/TaskDetailPage';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    tasksService: {
      getTaskById: vi.fn(),
      getTaskLogs: vi.fn(),
      updateTask: vi.fn(),
    },
    authService: {
      getCurrentUser: () => ({ id: 1, name: 'Test User' }),
      logout: vi.fn(),
    },
  };
});

const { tasksService } = await import('../services/api');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

describe('TaskDetailPage', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test description',
    status: 'pending',
    priority_id: 1,
    priority_name: 'High',
    priority_color: '#FF0000',
    group_id: 1,
    group_name: 'Work',
    group_color: '#0000FF',
    date: '2024-01-15',
    checklist: [
      { text: 'Item 1', checked: false },
      { text: 'Item 2', checked: true },
    ],
    links: [
      { text: 'Test link', created_at: '2024-01-15T10:00:00Z' },
    ],
    task_relations: [],
  };

  const mockLogs = [
    {
      id: 1,
      action: 'created',
      details: 'Задача создана',
      created_at: '2024-01-15T10:00:00Z',
      user_name: 'Test User',
    },
    {
      id: 2,
      action: 'status_changed',
      old_value: 'pending',
      new_value: 'in_progress',
      details: null,
      created_at: '2024-01-15T11:00:00Z',
      user_name: 'Test User',
    },
  ];

  beforeEach(() => {
    tasksService.getTaskById.mockResolvedValue({ task: mockTask });
    tasksService.getTaskLogs.mockResolvedValue({ logs: mockLogs });
    tasksService.updateTask.mockResolvedValue({ task: mockTask });
  });

  it('renders task details', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TaskDetailPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays checklist items', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TaskDetailPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('displays linked tasks (links)', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TaskDetailPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test link')).toBeInTheDocument();
    });
  });

  it('opens logs modal when logs button is clicked', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TaskDetailPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const logsButton = screen.getByText('Логи');
    fireEvent.click(logsButton);

    await waitFor(() => {
      expect(screen.getByText('История изменений')).toBeInTheDocument();
    });
  });

  it('shows creation log as first log', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TaskDetailPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const logsButton = screen.getByText('Логи');
    fireEvent.click(logsButton);

    await waitFor(() => {
      expect(screen.getByText('История изменений')).toBeInTheDocument();
      const creationTexts = screen.getAllByText('Задача создана');
      expect(creationTexts.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('allows editing checklist', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TaskDetailPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Редактировать');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Новый пункт чек-листа')).toBeInTheDocument();
    });
  });

  it('allows adding links', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TaskDetailPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const addLinkButton = screen.getByText('Добавить линк');
    fireEvent.click(addLinkButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Введите комментарий')).toBeInTheDocument();
    });
  });

  it('shows move modal when status changed to moved', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TaskDetailPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'moved' } });

    await waitFor(() => {
      expect(screen.getByText('Перенести задачу')).toBeInTheDocument();
    });
  });
});
