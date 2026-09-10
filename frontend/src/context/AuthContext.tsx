import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mini_erp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('mini_erp_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on boot
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('mini_erp_token');
      if (storedToken) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('mini_erp_user', JSON.stringify(freshUser));
        } catch {
          // Stored token is invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('mini_erp_token', data.token);
    localStorage.setItem('mini_erp_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mini_erp_token');
    localStorage.removeItem('mini_erp_user');
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
