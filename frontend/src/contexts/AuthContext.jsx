import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

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
