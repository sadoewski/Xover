import React from 'react';
import { IconAlertCircle, IconRefresh, IconHome } from '@tabler/icons-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown' // 'auth', 'network', 'render', 'unknown'
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Определяем тип ошибки для более точного сообщения
    const errorMessage = error?.toString() || '';
    let errorType = 'unknown';

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') ||
        errorMessage.includes('auth') || errorMessage.includes('token')) {
      errorType = 'auth';
    } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      errorType = 'network';
    } else if (errorMessage.includes('render') || errorMessage.includes('React')) {
      errorType = 'render';
    }

    this.setState({ error, errorInfo, errorType });

    // Проверяем если это ошибка авторизации
    if (errorType === 'auth') {
      // Очищаем данные
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Перенаправляем на логин через несколько мс
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  }

  getErrorMessage() {
    switch (this.state.errorType) {
      case 'auth':
        return {
          title: 'Сессия истекла',
          description: 'Ваша сессия авторизации истекла. Сейчас вы будете перенаправлены на страницу входа.',
          icon: '🔒'
        };
      case 'network':
        return {
          title: 'Проблемы с подключением',
          description: 'Не удалось подключиться к серверу. Проверьте интернет соединение и попробуйте обновить страницу.',
          icon: '🌐'
        };
      case 'render':
        return {
          title: 'Ошибка отображения',
          description: 'Произошла ошибка при отображении компонента. Попробуйте обновить страницу или вернитесь на главную.',
          icon: '⚠️'
        };
      default:
        return {
          title: 'Что-то пошло не так',
          description: 'Произошла неожиданная ошибка. Попробуйте обновить страницу или вернуться на главную.',
          icon: '❌'
        };
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getErrorMessage();

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: 'var(--bg-primary, #0A0D12)',
          color: 'var(--text-primary, #ffffff)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            padding: '48px',
            background: 'var(--surface-1, #0F131C)',
            borderRadius: '16px',
            border: '1px solid var(--border-primary, #1E2636)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              {errorMessage.icon}
            </div>

            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '16px',
              textAlign: 'center',
              color: 'var(--text-primary, #ffffff)'
            }}>
              {errorMessage.title}
            </h1>

            <p style={{
              fontSize: '15px',
              lineHeight: '1.6',
              color: 'var(--text-secondary, #9CA3AF)',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              {errorMessage.description}
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {this.state.errorType !== 'auth' && (
                <>
                  <button
                    onClick={this.handleReload}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'white',
                      background: 'var(--accent-primary, #3B6DFF)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(59, 109, 255, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <IconRefresh size={16} />
                    Обновить страницу
                  </button>

                  <button
                    onClick={this.handleGoIconHome}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary, #ffffff)',
                      background: 'var(--surface-2, #161D2B)',
                      border: '1px solid var(--border-primary, #1E2636)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'var(--surface-3, #1E2636)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'var(--surface-2, #161D2B)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <IconHome size={16} />
                    На главную
                  </button>
                </>
              )}

              <button
                onClick={this.handleGoLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #9CA3AF)',
                  background: 'transparent',
                  border: '1px solid var(--border-primary, #1E2636)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover, #374151)';
                  e.currentTarget.style.color = 'var(--text-primary, #ffffff)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary, #1E2636)';
                  e.currentTarget.style.color = 'var(--text-secondary, #9CA3AF)';
                }}
              >
                <IconAlertCircle size={16} />
                Войти заново
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: '32px',
                padding: '16px',
                background: 'var(--surface-2, #161D2B)',
                borderRadius: '8px',
                border: '1px solid var(--border-primary, #1E2636)'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  marginBottom: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #9CA3AF)',
                  userSelect: 'none'
                }}>
                  🔧 Детали ошибки (только в dev режиме)
                </summary>
                <pre style={{
                  fontSize: '11px',
                  lineHeight: '1.5',
                  padding: '12px',
                  background: 'var(--bg-primary, #0A0D12)',
                  borderRadius: '6px',
                  overflow: 'auto',
                  maxHeight: '240px',
                  color: '#FF6B6B',
                  fontFamily: 'Monaco, Menlo, "Courier New", monospace'
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
