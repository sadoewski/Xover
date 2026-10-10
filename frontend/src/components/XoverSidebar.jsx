import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Calendar, Repeat, Folder, Star, FileText, Target } from 'lucide-react';
import './XoverSidebar.css';

export default function XoverSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Админ-панель', Icon: BarChart3, path: '/' },
    { id: 'calendar', label: 'Календарь', Icon: Calendar, path: '/calendar' },
    { id: 'datatasks', label: 'DataTask', Icon: Repeat, path: '/datatasks' },
    { id: 'groups', label: 'Группы записей', Icon: Folder, path: '/groups' },
    { id: 'priorities', label: 'Приоритеты', Icon: Star, path: '/priorities' },
    { id: 'templates', label: 'Шаблоны задач', Icon: FileText, path: '/templates' },
    { id: 'events', label: 'События', Icon: Target, path: '/events' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`xover-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="xover-sidebar-content">
        <nav className="xover-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`xover-nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <item.Icon size={20} className="xover-nav-icon" />
              {!isCollapsed && <span className="xover-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <button
        className="xover-sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Развернуть' : 'Свернуть'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {isCollapsed ? (
            <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M10 12l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </button>
    </div>
  );
}
