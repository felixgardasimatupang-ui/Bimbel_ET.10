import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { clearTokens, getMe } from '../api/client';
import type { UserRole } from '../types';
import type { Session } from '@supabase/supabase-js';

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

function setTokensFromSession(session: Session | null) {
  if (session) {
    localStorage.setItem('edu_access_token', session.access_token);
    localStorage.setItem('edu_refresh_token', session.refresh_token);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setTokensFromSession(session);
        fetchUserProfile();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setTokensFromSession(session);
        fetchUserProfile();
      } else {
        setUser(null);
        clearTokens();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile() {
    try {
      const res = await getMe();
      if (res.success && res.data) {
        setUser(res.data as AuthUser);
      } else {
        clearTokens();
        await supabase.auth.signOut();
      }
    } catch {
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message === 'Invalid login credentials'
        ? 'Email atau password salah'
        : error.message };
    }
    if (data.session) {
      setTokensFromSession(data.session);
      try {
        const res = await getMe();
        if (res.success && res.data) {
          setUser(res.data as AuthUser);
          return { success: true };
        }
      } catch {
        return { success: true };
      }
    }
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthCtx.Provider>
  );
}
