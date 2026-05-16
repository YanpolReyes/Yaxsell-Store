'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/services/authService';
import { AuthService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, phone?: string, rut?: string, birthDate?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const isLoggedIn = await AuthService.isLoggedIn();
      if (isLoggedIn) {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await AuthService.login(email, password);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión'
      };
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string, rut?: string, birthDate?: string) => {
    try {
      const result = await AuthService.register(email, password, name, phone, rut, birthDate);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al registrarse'
      };
    }
  };

  const logout = async () => {
    try {
      const result = await AuthService.logout();
      if (result.success) {
        setUser(null);
      }
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al cerrar sesión'
      };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const result = await AuthService.updateProfile(updates);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al actualizar perfil'
      };
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
