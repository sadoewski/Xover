import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Определяем активный раздел на основе текущего URL
  const getActiveSection = () => {
    if (location.pathname === '/settings') return 'settings';
    // В будущем можно добавить проверку для wr:print
    return 'xover';
  };

  const activeSection = getActiveSection();

  const handleSectionChange = (section) => {
    if (section === 'xover') {
      navigate('/');
    } else if (section === 'wrprint') {
      // Пока заглушка
      alert('Раздел wr:print будет реализован в следующих версиях');
    } else if (section === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <div className="layout-container">
      {/* Верхняя навигация */}
      <header className="layout-header">
        <div className="layout-header-content">
          {/* Левая часть: переключатель разделов */}
          <div className="layout-header-left">
            <div className="section-switcher">
              <button
                onClick={() => handleSectionChange('xover')}
                className={`section-btn ${activeSection === 'xover' ? 'active' : ''}`}
              >
                xover
              </button>
              <button
                onClick={() => handleSectionChange('wrprint')}
                className={`section-btn ${activeSection === 'wrprint' ? 'active' : ''}`}
              >
                wr:print
              </button>
              <button
                onClick={() => handleSectionChange('settings')}
                className={`section-btn ${activeSection === 'settings' ? 'active' : ''}`}
              >
                Настройки
              </button>
            </div>
          </div>

          {/* Правая часть: версия, пользователь, выход */}
          <div className="layout-header-right">
            <span className="version-badge">v0.10 PreBeta</span>
            <span className="user-name">{user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Выход
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="layout-main">
        {children}
      </div>
    </div>
  );
}
