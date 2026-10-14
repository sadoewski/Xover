import { useState, useEffect } from 'react';
import { User, Mail, Calendar } from 'lucide-react';
import { authService } from '../../services/api';
import './UsersSettings.css';

export default function UsersSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  if (loading) {
    return <div className="users-settings loading">Загрузка...</div>;
  }

  return (
    <div className="users-settings">
      <h2>Пользователи</h2>

      {loading ? (
        <div className="loading-spinner">Загрузка...</div>
      ) : user ? (
        <div className="user-profile-card">
          <div className="user-avatar-large">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} />
            ) : (
              <User size={48} />
            )}
          </div>
          <div className="user-details">
            <h3>{user.username}</h3>
            <div className="user-info-grid">
              <div className="user-info-item">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <div className="user-info-item">
                <Calendar size={16} />
                <span>Регистрация: {new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>Пользователь не найден</div>
      )}
    </div>
  );
}
