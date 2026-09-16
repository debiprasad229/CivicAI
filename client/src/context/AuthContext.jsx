import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civicai_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('civicai_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Computed role helper
  const role = user?.role || 'citizen';
  const isAuthenticated = !!token && !!user;

  // On mount, verify existing token via /api/auth/me
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('civicai_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/auth/me');
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('civicai_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn('[AuthContext] Session verification failed, clearing credentials:', err.message);
        localStorage.removeItem('civicai_token');
        localStorage.removeItem('civicai_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('civicai_token', data.token);
        localStorage.setItem('civicai_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      throw new Error('Invalid response from authentication server');
    } catch (err) {
      const msg = err.message || 'Authentication failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  // Register handler
  const register = async (userData) => {
    setError(null);
    try {
      const data = await api.post('/auth/register', userData);
      if (data && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('civicai_token', data.token);
        localStorage.setItem('civicai_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      throw new Error('Registration failed');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('civicai_token');
    localStorage.removeItem('civicai_user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
