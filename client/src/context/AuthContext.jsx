import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { role: 'customer', id: 'c1', name: 'Priya Sharma', phone: '9811234567', pin: '1234' },
  { role: 'customer', id: 'c2', name: 'Ajay Mehta',  phone: '9822334455', pin: '1234' },
  { role: 'worker',   id: 'w1', name: 'Ramesh Kumar', phone: '9876543210', pin: '1234' },
  { role: 'worker',   id: 'w3', name: 'Geeta Devi',   phone: '9765432109', pin: '1234' },
  { role: 'admin',    id: 'a1', name: 'Admin User',   phone: '9000000000', pin: '0000' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sevasaathi_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('sevasaathi_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('sevasaathi_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const login = async (phone, pin, role) => {
    setLoading(true);
    try {
      const cleanPhone = String(phone).replace(/\D/g, '');
      const data = await api.login(cleanPhone, pin, role);
      
      if (data.success && data.user) {
        setUser(data.user);
        setLoading(false);
        return { success: true, user: data.user };
      }
      
      setLoading(false);
      return { success: false, error: 'Login failed' };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const cleanPhone = String(userData.phone).replace(/\D/g, '');
      const data = await api.register({ ...userData, phone: cleanPhone });
      
      if (data.success && data.user) {
        setUser(data.user);
        setLoading(false);
        return { success: true, user: data.user };
      }
      
      setLoading(false);
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('sevasaathi_user');
  };

  const demoLogin = async (account) => {
    setLoading(true);
    try {
      const data = await api.login(account.phone, account.pin, account.role);
      
      if (data.success && data.user) {
        setUser(data.user);
        setLoading(false);
        return data.user;
      }
      
      setLoading(false);
      return null;
    } catch (error) {
      setLoading(false);
      console.error('Demo login error:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, demoLogin, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
