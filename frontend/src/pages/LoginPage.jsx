import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);

      // Определяем тип ошибки
      const status = err.response?.status;
      const errorData = err.response?.data;

      if (status === 401 || status === 403) {
        // Неверный логин/пароль
        setError('Неверный username или пароль');
      } else if (status === 500) {
        // Ошибка сервера
        setError('Ошибка сервера. Пожалуйста, попробуйте позже или обратитесь к администратору.');
      } else if (err.message === 'Network Error' || !err.response) {
        // Ошибка сети
        setError('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      } else {
        // Другие ошибки
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
          <p>Планировщик задач и ежедневник</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <div className="auth-link">
            <Link to="/register">
              Нет аккаунта? Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
