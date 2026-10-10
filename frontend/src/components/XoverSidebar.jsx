import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Calendar, Repeat, Folder, Star, FileText, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import './XoverSidebar.css';

export default function XoverSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('xoverSidebarCollapsed');
    return saved === 'true';
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('xoverSidebarWidth');
    return saved ? parseInt(saved) : 240;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    localStorage.setItem('xoverSidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('xoverSidebarWidth', sidebarWidth);
  }, [sidebarWidth]);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(600, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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
    <div
      className={`xover-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      style={{ width: isCollapsed ? '64px' : `${sidebarWidth}px` }}
    >
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

        <button
          className="xover-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Развернуть' : 'Свернуть'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <div
          className={`xover-sidebar-resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={startResizing}
        />
      )}
    </div>
  );
}
