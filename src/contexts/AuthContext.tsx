import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { setAccessToken, clearTokens, getMe, loginApi, logoutApi } from '../api/client';
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
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.accessToken) {
          setAccessToken(data.data.accessToken);
          await fetchUserProfile();
          return;
        }
      }
    } catch {
      // no session to restore
    }
    setLoading(false);
  }

  async function fetchUserProfile() {
    try {
      const res = await getMe();
      if (res.success && res.data) {
        setUser(res.data as AuthUser);
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginApi(email, password);
      if (result.success) {
        await fetchUserProfile();
        return { success: true };
      }
      return { success: false, error: result.error || 'Email atau password salah' };
    } catch {
      return { success: false, error: 'Gagal terhubung ke server' };
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthCtx.Provider>
  );
}
