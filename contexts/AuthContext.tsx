/**
 * Contexto de autenticación para la aplicación móvil
 * Adaptado de la versión del portal para React Native
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '@/constants/oauth';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        await verifyToken(token);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const login = async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await verifyToken(token);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  };

  const getToken = async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
