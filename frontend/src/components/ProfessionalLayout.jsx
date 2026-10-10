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
  ChevronUp,
  Home,
  Users,
  BarChart3,
  FileText,
  Sun,
  Moon,
  Database,
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
    xover: true,
  });

  // Определяем активную вкладку на основе текущего пути
  const getActiveTab = () => {
    if (location.pathname.startsWith('/rwprint')) return 'rwprint';
    if (location.pathname === '/settings') return 'settings';
    return 'xover';
  };

  const activeTab = getActiveTab();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load sidebar state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Load toolbar collapsed state from localStorage
  const [toolbarCollapsed, setToolbarCollapsed] = useState(() => {
    const saved = localStorage.getItem('toolbarCollapsed');
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

  // Save toolbar state to localStorage when it changes
  const toggleToolbar = () => {
    setToolbarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('toolbarCollapsed', String(newValue));
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
      id: 'xover',
      title: 'XOVER',
      icon: Home,
      items: [
        { path: '/calendar', label: 'Календарь', icon: Calendar },
        { path: '/events', label: 'События', icon: Clock },
        { path: '/datatasks', label: 'DataTask', icon: Database },
        { path: '/groups', label: 'Группы', icon: Folder },
        { path: '/priorities', label: 'Приоритеты', icon: Star },
      ]
    },
  ];

  const breadcrumbs = activeTab === 'xover' ? [
    { label: 'Админ-панель', path: '/' },
    ...(location.pathname === '/calendar' ? [{ label: 'Календарь', path: '/calendar' }] : []),
    ...(location.pathname === '/events' ? [{ label: 'События', path: '/events' }] : []),
    ...(location.pathname === '/datatasks' ? [{ label: 'DataTask', path: '/datatasks' }] : []),
    ...(location.pathname === '/groups' ? [{ label: 'Группы', path: '/groups' }] : []),
    ...(location.pathname === '/priorities' ? [{ label: 'Приоритеты', path: '/priorities' }] : []),
    ...(location.pathname.startsWith('/tasks/') ? [
      { label: 'Календарь', path: '/calendar' },
      { label: 'Задача', path: location.pathname }
    ] : []),
  ] : [];

  return (
    <div className="professional-layout">
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="mobile-overlay active"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Top Toolbar */}
      <div className={`toolbar ${toolbarCollapsed ? 'collapsed' : ''}`}>
        <div className="toolbar-left">
          {/* Mobile Menu Button */}
          {isMobile && activeTab === 'xover' && (
            <button
              className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <div className="app-logo">
            <span className="app-name">Xover</span>
          </div>

          {/* Toolbar Collapse Toggle */}
          <button
            className="toolbar-collapse-btn"
            onClick={toggleToolbar}
            title={toolbarCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
          >
            {toolbarCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!toolbarCollapsed && (
          <>
            <div className="toolbar-center">
              {/* Tab Switcher */}
              <div className="tab-switcher">
                <button
                  className={`tab-btn ${activeTab === 'xover' ? 'active' : ''}`}
                  onClick={() => navigate('/calendar')}
                >
                  Xover
                </button>
                <button
                  className={`tab-btn ${activeTab === 'rwprint' ? 'active' : ''}`}
                  onClick={() => navigate('/rwprint')}
                >
                  rw:Print
                </button>
                <button
                  className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => navigate('/settings')}
                >
                  <Settings size={16} />
                  Настройки
                </button>
              </div>
            </div>

            <div className="toolbar-right">
              {/* Breadcrumbs - moved into toolbar */}
              {breadcrumbs.length > 0 && (
                <div className="toolbar-breadcrumbs">
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

              {/* Theme Toggle */}
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="user-info" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }}>
                {user?.avatar_url ? (
                  <img
                    src={getAvatarUrl(user.avatar_url)}
                    alt={user.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--border-primary)'
                    }}
                  />
                ) : (
                  <Users size={16} />
                )}
                <span className="user-name">{user?.name}</span>
              </div>
              <button className="btn-icon" onClick={handleLogout} title="Выйти">
                <LogOut size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Breadcrumbs Bar - Remove this section as breadcrumbs are now in toolbar */}

      <div className="layout-body">
        {/* Sidebar Navigation Tree - только для Xover */}
        {activeTab === 'xover' && (
          <>
            <div
              className={`sidebar-nav ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}
              style={{ width: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
            >
              <div className="nav-tree">
              {/* Admin Panel - Outside tree */}
              <button
                className={`nav-item-standalone ${isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
                title={sidebarCollapsed ? 'Админ-панель' : ''}
              >
                <BarChart3 size={16} />
                {!sidebarCollapsed && <span className="nav-item-label">Админ-панель</span>}
              </button>

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

                  {sidebarCollapsed && (
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
        )}

        {/* Main Content Area */}
        <div className="main-content">
          {children}
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
