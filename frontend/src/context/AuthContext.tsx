import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  userId: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  companyId?: string | null;
}

type AuthContextType = {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  login: (token?: string, userData?: any) => void;
  logout: () => void;
  updateUser: (userData: Partial<UserProfile>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token') || localStorage.getItem('accessToken') || null);
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
      
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      const email = localStorage.getItem('email');
      const mobile = localStorage.getItem('mobile');
      const role = localStorage.getItem('role');
      const companyId = localStorage.getItem('companyId');

      if (userId || username) {
        return {
          userId: userId || '',
          id: userId || '',
          username: username || 'User',
          name: username || 'User',
          email: email || '',
          mobile: mobile || '',
          role: role || 'user',
          companyId: companyId || null,
        };
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  const login = (newToken?: string, userData?: any) => {
    const t = newToken || localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    
    let u: UserProfile;
    if (userData) {
      u = {
        userId: userData?.userId || userData?.id || userData?._id || '',
        id: userData?.userId || userData?.id || '',
        username: userData?.username || userData?.name || 'User',
        name: userData?.username || userData?.name || 'User',
        email: userData?.email || '',
        mobile: userData?.mobile || userData?.phno || '',
        role: userData?.role || 'user',
        companyId: userData?.companyId || null,
      };
    } else {
      const stored = localStorage.getItem('user');
      if (stored) {
        u = JSON.parse(stored);
      } else {
        u = {
          userId: localStorage.getItem('userId') || '',
          username: localStorage.getItem('username') || 'User',
          email: localStorage.getItem('email') || '',
          mobile: localStorage.getItem('mobile') || '',
          role: localStorage.getItem('role') || 'user',
          companyId: localStorage.getItem('companyId') || null,
        };
      }
    }

    setToken(t);
    setUser(u);
    setIsAuthenticated(true);

    if (newToken) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('accessToken', newToken);
    }
    localStorage.setItem('user', JSON.stringify(u));
    if (u.userId) localStorage.setItem('userId', u.userId);
    if (u.username) localStorage.setItem('username', u.username);
    if (u.email) localStorage.setItem('email', u.email);
    if (u.mobile) localStorage.setItem('mobile', u.mobile);
    if (u.role) localStorage.setItem('role', u.role);
    if (u.companyId) localStorage.setItem('companyId', u.companyId);
  };


  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('mobile');
    localStorage.removeItem('role');
    localStorage.removeItem('companyId');
  };

  const updateUser = (userData: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...userData } : (userData as UserProfile);
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};