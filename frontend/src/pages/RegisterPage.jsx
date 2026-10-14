import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Передаем только username и password, name будет = username по умолчанию
      await register(username, password, username, null, null);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);

      const status = err.response?.status;
      const errorData = err.response?.data;

      // Обработка ошибок валидации
      if (errorData?.details && Array.isArray(errorData.details)) {
        const messages = errorData.details.map(d => d.message).join('. ');
        setError(messages);
      } else if (status === 409 || status === 400) {
        // Конфликт (пользователь уже существует) или некорректные данные
        setError(errorData?.error || 'Пользователь с таким username уже существует');
      } else if (status === 500) {
        setError('Ошибка сервера. Пожалуйста, попробуйте позже.');
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      } else {
        setError(errorData?.error || 'Ошибка регистрации. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Регистрация</h2>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              Username <span className="required">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="form-input"
              placeholder="Введите username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9_]+"
              title="Только буквы, цифры и подчеркивание"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Пароль <span className="required">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small className="form-hint">
              Минимум 8 символов, должен содержать заглавные и строчные буквы, цифру
            </small>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          <div className="auth-link">
            <Link to="/login">
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
