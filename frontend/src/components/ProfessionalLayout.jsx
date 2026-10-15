import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconCalendar,
  IconClock,
  IconFolder,
  IconStar,
  IconSettings,
  IconLogout,
  IconChevronRight,
  IconChevronDown,
  IconChevronLeft,
  IconHome,
  IconUsers,
  IconChartBar,
  IconSun,
  IconMoon,
  IconDatabase,
  IconTerminal2,
  IconMenu2,
  IconX,
  IconKey,
  IconTags,
} from '@tabler/icons-react';
import { authService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getAvatarUrl } from '../utils/url';
import UserProfileModal from './UserProfileModal';
import './ProfessionalLayout.css';

const ProfessionalLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
  });

  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load sidebar state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 240;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeIconStartX, setResizeIconStartX] = useState(0);
  const [resizeIconStartWidth, setResizeIconStartWidth] = useState(0);

  // Mobile menu state
  const [mobileIconMenu2Open, setMobileIconMenu2Open] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileIconMenu2Open(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileIconMenu2Open && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileIconMenu2Open, isMobile]);

  // IconDeviceFloppy sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebarCollapsed', String(newValue));
      return newValue;
    });
  };

  // Sidebar resize handlers
  const startResizing = (e) => {
    setIsResizing(true);
    setResizeIconStartX(e.clientX);
    setResizeIconStartWidth(sidebarWidth);
  };

  useEffect(() => {
    if (!isResizing) return;

    // Add body class for cursor feedback
    document.body.classList.add('resizing');

    const handleMouseMove = (e) => {
      const delta = e.clientX - resizeIconStartX;
      const newWidth = resizeIconStartWidth + delta;
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('resizing');
      localStorage.setItem('sidebarWidth', String(sidebarWidth));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing');
    };
  }, [isResizing, resizeIconStartX, resizeIconStartWidth, sidebarWidth]);

  const toggleMobileIconMenu2 = () => {
    setMobileIconMenu2Open(prev => !prev);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navigationTree = [
    {
      id: 'properties',
      title: 'Свойства',
      icon: IconFolder,
      items: [
        { path: '/taskbases', label: 'TaskBase', icon: IconDatabase },
        { path: '/groups', label: 'Ключи', icon: IconKey },
        { path: '/priorities', label: 'Теги', icon: IconTags },
      ]
    },
  ];

  const breadcrumbs = [
    { label: 'Админ-панель', path: '/' },
    ...(location.pathname === '/calendar' ? [{ label: 'Календарь', path: '/calendar' }] : []),
    ...(location.pathname === '/events' ? [{ label: 'События', path: '/events' }] : []),
    ...(location.pathname === '/taskbases' ? [{ label: 'TaskBase', path: '/taskbases' }] : []),
    ...(location.pathname === '/groups' ? [{ label: 'Ключи', path: '/groups' }] : []),
    ...(location.pathname === '/priorities' ? [{ label: 'Теги', path: '/priorities' }] : []),
    ...(location.pathname === '/terminal' ? [{ label: 'Shell', path: '/terminal' }] : []),
    ...(location.pathname === '/settings' ? [{ label: 'Настройки', path: '/settings' }] : []),
    ...(location.pathname.startsWith('/tasks/') ? [
      { label: 'Календарь', path: '/calendar' },
      { label: 'Задача', path: location.pathname }
    ] : []),
  ];

  return (
    <div className="professional-layout">
      {/* Mobile Overlay */}
      {isMobile && mobileIconMenu2Open && (
        <div
          className="mobile-overlay active"
          onClick={toggleMobileIconMenu2}
        />
      )}

      <div className="layout-body">
        {/* Sidebar Navigation Tree */}
        <>
          <div
            className={`sidebar-nav ${sidebarCollapsed ? 'collapsed' : ''} ${mobileIconMenu2Open ? 'mobile-open' : ''}`}
            style={{ width: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
          >
            <div className="nav-tree">
              {/* Logo Button - Xover / X */}
              <button
                className={`nav-logo-btn ${isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
                title="Админ-панель"
              >
                {sidebarCollapsed ? (
                  <span className="logo-icon">X</span>
                ) : (
                  <span className="logo-text">Xover</span>
                )}
              </button>

              {/* Admin Panel */}
              <button
                className={`nav-item-standalone ${isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
                title={sidebarCollapsed ? 'Админ-панель' : ''}
              >
                <IconChartBar size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">Админ-панель</span>}
              </button>

              {/* IconCalendar */}
              <button
                className={`nav-item-standalone ${isActive('/calendar') ? 'active' : ''}`}
                onClick={() => navigate('/calendar')}
                title={sidebarCollapsed ? 'Календарь' : ''}
              >
                <IconCalendar size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">Календарь</span>}
              </button>

              {/* Properties Tree */}
              {navigationTree.map(section => (
                <div key={section.id} className="nav-section">
                  <button
                    className="nav-section-header"
                    onClick={() => toggleSection(section.id)}
                    title={sidebarCollapsed ? section.title : ''}
                  >
                    <section.icon size={16} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="nav-section-title">{section.title}</span>
                        {expandedSections[section.id] ? (
                          <IconChevronDown size={14} className="nav-chevron" />
                        ) : (
                          <IconChevronRight size={14} className="nav-chevron" />
                        )}
                      </>
                    )}
                  </button>

                  {!sidebarCollapsed && expandedSections[section.id] && (
                    <div className="nav-items">
                      {section.items.map(item => (
                        <button
                          key={item.path}
                          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon size={16} />
                          <span className="nav-item-label">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {sidebarCollapsed && expandedSections[section.id] && (
                    <div className="nav-items-collapsed">
                      {section.items.map(item => (
                        <button
                          key={item.path}
                          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                          onClick={() => navigate(item.path)}
                          title={item.label}
                        >
                          <item.icon size={16} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Events */}
              <button
                className={`nav-item-standalone ${isActive('/events') ? 'active' : ''}`}
                onClick={() => navigate('/events')}
                title={sidebarCollapsed ? 'События' : ''}
              >
                <IconClock size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">События</span>}
              </button>

              {/* Shell */}
              <button
                className={`nav-item-standalone ${isActive('/terminal') ? 'active' : ''}`}
                onClick={() => navigate('/terminal')}
                title={sidebarCollapsed ? 'Shell' : ''}
              >
                <IconTerminal2 size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">Shell</span>}
              </button>

              {/* IconSettings */}
              <button
                className={`nav-item-standalone ${isActive('/settings') ? 'active' : ''}`}
                onClick={() => navigate('/settings')}
                title={sidebarCollapsed ? 'Настройки' : ''}
              >
                <IconSettings size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">Настройки</span>}
              </button>
            </div>

            {/* Sidebar Footer - Theme and User */}
            <div className="sidebar-footer">
              {/* Theme Toggle */}
              <button
                className="sidebar-footer-item"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
              >
                {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                {!sidebarCollapsed && <span>{theme === 'dark' ? 'Светлая' : 'Темная'}</span>}
              </button>

              {/* User Profile */}
              {!sidebarCollapsed && (
                <div className="sidebar-user" onClick={() => setShowProfileModal(true)}>
                  {user?.avatar_url ? (
                    <img
                      src={getAvatarUrl(user.avatar_url)}
                      alt={user.name}
                      className="sidebar-avatar"
                    />
                  ) : (
                    <IconUsers size={16} />
                  )}
                  <span className="sidebar-user-name">{user?.name}</span>
                  <button
                    className="sidebar-logout"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    title="Выйти"
                  >
                    <IconLogout size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Collapse Toggle */}
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
            >
              {sidebarCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
            </button>

            {/* Resize Handle */}
            {!sidebarCollapsed && (
              <div
                className={`sidebar-resize-handle ${isResizing ? 'resizing' : ''}`}
                onMouseDown={startResizing}
              />
            )}
          </div>
        </>

        {/* Main Content Area */}
        <div className="main-content">
          <div className="main-content-inner">
            {children}
          </div>

          {/* Breadcrumbs - moved to bottom */}
          {breadcrumbs.length > 0 && (
            <div className="bottom-breadcrumbs">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && <IconChevronRight size={14} className="breadcrumb-separator" />}
                  <button
                    className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                    onClick={() => navigate(crumb.path)}
                    disabled={index === breadcrumbs.length - 1}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default ProfessionalLayout;
