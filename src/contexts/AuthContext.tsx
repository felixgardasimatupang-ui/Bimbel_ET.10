import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { clearTokens, getMe, loginApi } from '../api/client';
import type { UserRole } from '../types';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('edu_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((res) => {
        if (res.success && res.data) {
          setUser(res.data as AuthUser);
        } else {
          clearTokens();
        }
      })
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginApi(email, password);
    if (result.success && result.data) {
      const u = (result.data as unknown as { user: AuthUser }).user;
      setUser(u);
      return { success: true };
    }
    return { success: false, error: result.error || 'Login gagal' };
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthCtx.Provider>
  );
}
