import React from 'react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Проверяем если это ошибка авторизации
    const errorMessage = error?.toString() || '';
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('auth')) {
      // Очищаем данные
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Перенаправляем на логин через несколько мс
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '40px',
            background: 'var(--surface-1)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Что-то пошло не так</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Произошла ошибка при загрузке приложения. Возможно, ваша сессия устарела.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Перейти на страницу входа
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '24px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Детали ошибки (только в dev режиме)
                </summary>
                <pre style={{
                  fontSize: '11px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
