// AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config/constants';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const decoded: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
          } else {
            const res = await axios.get(`${API_URL}/api/users/me`);
            setUser(res.data);
          }
        } catch {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (userData: Partial<User>) => {
    const res = await axios.put(`${API_URL}/api/users/profile`, userData);
    setUser(res.data);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
