import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      if (authService.isAuthenticated()) {
        const userData = authService.getCurrentUser();
        setUser(userData);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    const result = await authService.login(username, password);
    
    if (result.success) {
      setUser(result.user);
    }
    
    setLoading(false);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasRole = (roleName) => {
    return user?.roles?.includes(roleName) || false;
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
