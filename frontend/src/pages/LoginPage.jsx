import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = username, 2 = password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if username exists
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        setStep(2);
      } else {
        setError('Пользователь не найден');
      }
    } catch (err) {
      console.error('Username check error:', err);
      setError('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);

      const status = err.response?.status;
      const errorData = err.response?.data;

      if (status === 401 || status === 403) {
        setError('Неверный пароль');
      } else if (status === 500) {
        setError('Ошибка сервера. Пожалуйста, попробуйте позже или обратитесь к администратору.');
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      } else {
        setError(errorData?.error || errorData?.message || 'Ошибка входа. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Вход в Xover</h2>
        </div>

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleUsernameSubmit}>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="form-input"
                placeholder="Введите username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? 'Проверка...' : 'Далее'}
            </button>

            <div className="auth-link">
              <Link to="/register">
                Нет аккаунта? Зарегистрироваться
              </Link>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Hidden username field for accessibility */}
            <input
              type="text"
              name="username"
              value={username}
              autoComplete="username"
              readOnly
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username-display"
                type="text"
                className="form-input"
                value={username}
                autoComplete="username"
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setPassword('');
                setError('');
              }}
              className="btn-secondary"
              style={{ marginTop: '8px' }}
            >
              Назад
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
