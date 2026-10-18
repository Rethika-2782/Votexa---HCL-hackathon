import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, PlanUsageInfo } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  usage: PlanUsageInfo | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<PlanUsageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  const refreshUserData = async () => {
    const token = localStorage.getItem('votexa_token');
    if (!token) {
      setUser(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setUsage(data.usage);
    } catch (err) {
      console.warn('Session verification failed, logging out', err);
      localStorage.removeItem('votexa_token');
      setUser(null);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('votexa_token', token);
    setUser(userData);
    refreshUserData();
  };

  const logout = () => {
    localStorage.removeItem('votexa_token');
    setUser(null);
    setUsage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        usage,
        loading,
        login,
        logout,
        refreshUserData,
        isUpgradeModalOpen,
        openUpgradeModal: () => setIsUpgradeModalOpen(true),
        closeUpgradeModal: () => setIsUpgradeModalOpen(false),
      }}
    >
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
