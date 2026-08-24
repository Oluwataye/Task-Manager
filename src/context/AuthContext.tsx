import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company, Role } from '../types';
import { apiRequest } from '../lib/api';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (targetRole: Role) => Promise<void>;
  updateCompany: (company: Company) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Apply primary and secondary colors dynamically to CSS root variables
  const applyThemeColors = (comp: Company | null) => {
    if (!comp) return;
    const root = document.documentElement;
    if (comp.primaryColor) {
      root.style.setProperty('--color-primary', comp.primaryColor);
      // Darker shade for hover
      root.style.setProperty('--color-primary-hover', comp.primaryColor);
    }
    if (comp.secondaryColor) {
      root.style.setProperty('--color-secondary', comp.secondaryColor);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await apiRequest<{ user: User & { company: Company } }>('/auth/me');
      const savedLogo = localStorage.getItem('company_logo');
      const comp = { ...data.user.company, logoUrl: savedLogo || data.user.company.logoUrl };
      setUser({ ...data.user, company: comp });
      setCompany(comp);
      applyThemeColors(comp);
    } catch (err) {
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ user: User & { company: Company }; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const savedLogo = localStorage.getItem('company_logo');
    const comp = { ...data.user.company, logoUrl: savedLogo || data.user.company.logoUrl };
    setUser({ ...data.user, company: comp });
    setCompany(comp);
    applyThemeColors(comp);
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setCompany(null);
    }
  };

  const switchRole = async (targetRole: Role) => {
    setLoading(true);
    try {
      const data = await apiRequest<{ user: User & { company: Company } }>('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ targetRole }),
      });
      setUser(data.user);
      setCompany(data.user.company);
      applyThemeColors(data.user.company);
    } catch (err: any) {
      alert(err.message || 'Failed to switch role');
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = (newCompany: Company) => {
    setCompany(newCompany);
    applyThemeColors(newCompany);
    if (user) {
      setUser({ ...user, company: newCompany });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        loading,
        login,
        logout,
        switchRole,
        updateCompany,
        refreshUser,
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
