import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Key, Upload, X, Check } from 'lucide-react';
import { getAvatarUrl } from '../utils/url';
import './UserProfileModal.css';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, uploadAvatar, changePassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !user) return null;

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Сначала обновляем профиль
      await updateProfile(name, email || null);

      // Если есть новый аватар, загружаем его
      if (avatarFile) {
        await uploadAvatar(avatarFile);
        setAvatarFile(null);
        setAvatarPreview(null);
      }

      setSuccess('Профиль успешно обновлен');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      setSuccess('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка изменения пароля');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Профиль пользователя</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            Профиль
          </button>
          <button
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Key size={16} />
            Пароль
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="message error-message">
              {error}
            </div>
          )}
          {success && (
            <div className="message success-message">
              <Check size={16} />
              {success}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="avatar-section">
                <div className="avatar-display">
                  {avatarPreview || user?.avatar_url ? (
                    <img src={avatarPreview || getAvatarUrl(user.avatar_url)} alt="Avatar" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <input
                  type="file"
                  id="avatar-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => document.getElementById('avatar-input').click()}
                >
                  <Upload size={14} />
                  Загрузить фото
                </button>
                {(avatarPreview || user?.avatar_url) && (
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarFile(null);
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>

              <div className="profile-info">
                <div className="info-item">
                  <User size={16} />
                  <div className="info-content">
                    <label>Username</label>
                    <span className="username-display">{user.username}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Имя</label>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Необязательно"
                  />
                </div>

                <div className="info-item">
                  <Calendar size={16} />
                  <div className="info-content">
                    <label>Дата создания</label>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label htmlFor="old-password">Старый пароль</label>
                <input
                  id="old-password"
                  type="password"
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">Новый пароль</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <small className="form-hint">
                  Минимум 8 символов, должен содержать заглавные и строчные буквы, цифру
                </small>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Изменение...' : 'Изменить пароль'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost btn-danger" onClick={logout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}
