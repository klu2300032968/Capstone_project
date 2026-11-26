import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/apiClient';

const AuthContext = createContext(null);

// Safe Base64URL decoder for JWT payload
function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  // Theme management: defaults to 'dark' (Command Center theme)
  const [theme, setTheme] = useState(() => localStorage.getItem('arsa_theme') || 'dark');

  // Token & user initialization with expiration check
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return null;
    const payload = parseJwtPayload(savedToken);
    if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    return savedToken;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (!savedUser || !savedToken) return null;
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Apply theme class to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('arsa_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
      setError('Your security session has expired. Please authenticate again.');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    // Purge previous session tokens to prevent identity leakage across logins
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    try {
      const response = await authApi.login(username, password);
      const userObj = {
        id: response.id,
        username: response.username,
        email: response.email,
        role: response.role,
        loginTime: new Date().toISOString()
      };
      setToken(response.token);
      setUser(userObj);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userObj));
      return { success: true, user: userObj };
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password) => {
    setLoading(true);
    setError(null);
    // Purge previous session tokens before self-registration
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    try {
      await authApi.signup(username, email, password);
      // Auto-login after successful registration
      return await login(username, password);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check input parameters.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setError(null);
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      error,
      login,
      signup,
      logout,
      isAuthenticated,
      isAdmin,
      theme,
      toggleTheme,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
