import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Folder,
  Star,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Home,
  Users,
  BarChart3,
  Sun,
  Moon,
  Database,
  Terminal,
  Menu,
  X,
} from 'lucide-react';
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
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, isMobile]);

  // Save sidebar state to localStorage when it changes
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
    setResizeStartX(e.clientX);
    setResizeStartWidth(sidebarWidth);
  };

  useEffect(() => {
    if (!isResizing) return;

    // Add body class for cursor feedback
    document.body.classList.add('resizing');

    const handleMouseMove = (e) => {
      const delta = e.clientX - resizeStartX;
      const newWidth = resizeStartWidth + delta;
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
  }, [isResizing, resizeStartX, resizeStartWidth, sidebarWidth]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
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
      icon: Folder,
      items: [
        { path: '/taskbases', label: 'TaskBase', icon: Database },
        { path: '/groups', label: 'Группы', icon: Folder },
        { path: '/priorities', label: 'Приоритеты', icon: Star },
      ]
    },
  ];

  const breadcrumbs = [
    { label: 'Админ-панель', path: '/' },
    ...(location.pathname === '/calendar' ? [{ label: 'Календарь', path: '/calendar' }] : []),
    ...(location.pathname === '/events' ? [{ label: 'События', path: '/events' }] : []),
    ...(location.pathname === '/taskbases' ? [{ label: 'TaskBase', path: '/taskbases' }] : []),
    ...(location.pathname === '/groups' ? [{ label: 'Группы', path: '/groups' }] : []),
    ...(location.pathname === '/priorities' ? [{ label: 'Приоритеты', path: '/priorities' }] : []),
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
      {isMobile && mobileMenuOpen && (
        <div
          className="mobile-overlay active"
          onClick={toggleMobileMenu}
        />
      )}

      <div className="layout-body">
        {/* Sidebar Navigation Tree */}
        <>
          <div
            className={`sidebar-nav ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}
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
                <BarChart3 size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">Админ-панель</span>}
              </button>

              {/* Calendar */}
              <button
                className={`nav-item-standalone ${isActive('/calendar') ? 'active' : ''}`}
                onClick={() => navigate('/calendar')}
                title={sidebarCollapsed ? 'Календарь' : ''}
              >
                <Calendar size={16} />
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
                          <ChevronDown size={14} className="nav-chevron" />
                        ) : (
                          <ChevronRight size={14} className="nav-chevron" />
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
                <Clock size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">События</span>}
              </button>

              {/* Shell */}
              <button
                className={`nav-item-standalone ${isActive('/terminal') ? 'active' : ''}`}
                onClick={() => navigate('/terminal')}
                title={sidebarCollapsed ? 'Shell' : ''}
              >
                <Terminal size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">Shell</span>}
              </button>

              {/* Settings */}
              <button
                className={`nav-item-standalone ${isActive('/settings') ? 'active' : ''}`}
                onClick={() => navigate('/settings')}
                title={sidebarCollapsed ? 'Настройки' : ''}
              >
                <Settings size={16} />
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
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
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
                    <Users size={16} />
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
                    <LogOut size={14} />
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
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
                  {index > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
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
