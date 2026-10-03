import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ProfessionalLayout from '../components/ProfessionalLayout';

const mockUser = { id: 1, name: 'Test User' };

vi.mock('../services/api', () => ({
  authService: {
    getCurrentUser: () => mockUser,
    logout: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/calendar' }),
  };
});

describe('Layout и навигация', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('отображает верхнюю панель навигации', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfessionalLayout>
            <div>Контент</div>
          </ProfessionalLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Hostlog')).toBeInTheDocument();
    expect(screen.getByText('rw:Print')).toBeInTheDocument();
    expect(screen.getByText('Настройки')).toBeInTheDocument();
  });

  it('отображает информацию о пользователе', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfessionalLayout>
            <div>Контент</div>
          </ProfessionalLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/Xover.*PreRelease/)).toBeInTheDocument();
  });

  it('подсвечивает активный раздел hostlog', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfessionalLayout>
            <div>Контент</div>
          </ProfessionalLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    const hostlogButton = screen.getByRole('button', { name: 'Hostlog' });
    expect(hostlogButton).toHaveClass('active');
  });

  it('переключает разделы при клике', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfessionalLayout>
            <div>Контент</div>
          </ProfessionalLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    const settingsButton = screen.getByRole('button', { name: /Настройки/ });
    fireEvent.click(settingsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('переключается на календарь при клике', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfessionalLayout>
            <div>Контент</div>
          </ProfessionalLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    const calendarButtons = screen.getAllByRole('button', { name: 'Календарь' });
    // Кликаем на кнопку в сайдбаре (не на breadcrumb)
    const sidebarButton = calendarButtons.find(btn => !btn.disabled);
    fireEvent.click(sidebarButton);

    expect(mockNavigate).toHaveBeenCalledWith('/calendar');
  });
});
