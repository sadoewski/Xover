import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Upload, X } from 'lucide-react';
import './AuthPages.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: В будущем загрузить аватар на сервер и получить URL
      // Сейчас передаем base64 напрямую (временное решение)
      await register(username, password, name, email || null, avatarPreview);
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (Array.isArray(errorMsg)) {
        setError(errorMsg.map(e => e.msg).join(', '));
      } else {
        setError(errorMsg || 'Ошибка регистрации');
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
          <p>Создайте аккаунт для использования Xover</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="avatar-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            {avatarPreview ? (
              <div className="avatar-preview">
                <img src={avatarPreview} alt="Avatar preview" />
                <button
                  type="button"
                  className="remove-avatar"
                  onClick={removeAvatar}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} />
                <span>Добавить фото профиля</span>
              </button>
            )}
          </div>

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
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">
              Имя <span className="required">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="form-input"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (необязательно)</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
