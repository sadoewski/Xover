import { useState, useEffect } from 'react';
import { User, Mail, Calendar, HardDrive } from 'lucide-react';
import { authService, rwprintService } from '../../services/api';
import './UsersSettings.css';

export default function UsersSettings() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalSize: 0,
    totalWords: 0,
    totalChars: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const fetchUserData = () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await rwprintService.getStorageStats();
      setStats(statsData);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
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

      {user && (
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
      )}

      <div className="stats-section">
        <h3>Статистика RW:Print</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon documents">
              <HardDrive size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Всего документов</div>
              <div className="stat-value">{stats.totalDocuments}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon size">
              <HardDrive size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Занято места</div>
              <div className="stat-value">{formatBytes(stats.totalSize)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon words">
              <HardDrive size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Всего слов</div>
              <div className="stat-value">{formatNumber(stats.totalWords)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon chars">
              <HardDrive size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Всего символов</div>
              <div className="stat-value">{formatNumber(stats.totalChars)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
