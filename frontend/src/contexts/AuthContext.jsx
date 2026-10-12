import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateAuth();
  }, []);

  const validateAuth = async () => {
    const currentUser = authService.getCurrentUser();
    const token = localStorage.getItem('token');

    // Если есть токен и данные пользователя в localStorage
    if (token && currentUser) {
      try {
        // Проверяем валидность токена через запрос к API
        const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : '/api');
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Токен невалидный или пользователь не существует - делаем logout
          console.warn('Токен невалиден или пользователь не существует. Выполняется выход.');
          authService.logout();
          setUser(null);
        }
      } catch (error) {
        console.error('Ошибка проверки токена:', error);
        // В случае любой ошибки - очищаем токен для безопасности
        authService.logout();
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  };

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser(data.user);
    return data;
  };

  const register = async (username, password, name, email, avatar_url) => {
    const data = await authService.register(username, password, name, email, avatar_url);
    setUser(data.user);
    return data;
  };

  const updateProfile = async (name, email) => {
    const data = await authService.updateProfile(name, email);
    setUser(data.user);
    return data;
  };

  const uploadAvatar = async (file) => {
    const data = await authService.uploadAvatar(file);
    setUser(data.user);
    return data;
  };

  const changePassword = async (old_password, new_password) => {
    return await authService.changePassword(old_password, new_password);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    updateProfile,
    uploadAvatar,
    changePassword,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
