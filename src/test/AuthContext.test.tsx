import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock Supabase client
vi.mock('../lib/supabase', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };

  const mockAuth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };

  return {
    supabase: {
      auth: mockAuth,
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    },
  };
});

import { supabase } from '../lib/supabase';

function createStore() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    [Symbol.toStringTag]: 'Storage',
  };
}

let storage: ReturnType<typeof createStore>;

beforeEach(() => {
  storage = createStore();
  vi.stubGlobal('localStorage', storage);
  vi.restoreAllMocks();

  // Default: no session, no auth state change
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  } as any);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function TestConsumer() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'done'}</div>
      <div data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user ? user.name : 'none'}</div>
      <div data-testid="email">{user ? user.email : 'none'}</div>
      <button data-testid="btn-login" onClick={() => login('test@test.com', 'pass')}>Login</button>
      <button data-testid="btn-logout" onClick={logout}>Logout</button>
    </div>
  );
}

function renderCtx() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe('AuthContext', () => {
  it('shows done and not authenticated when no session', async () => {
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('restores session when valid session exists', async () => {
    storage.setItem('edu_access_token', 'token-exists');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'token-exists',
          refresh_token: 'r',
          user: { id: 'sb-1', email: 'user@test.com', user_metadata: {} },
          expires_in: 3600,
        } as any,
      },
      error: null,
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        success: true,
        data: { id: '1', email: 'user@test.com', name: 'Test User', role: 'ADMIN' },
      }), { status: 200 }),
    );

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    expect(screen.getByTestId('auth').textContent).toBe('yes');
    expect(screen.getByTestId('user').textContent).toBe('Test User');
  });

  it('clears token state when session but getMe fails', async () => {
    storage.setItem('edu_access_token', 'bad-token');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'bad-token',
          refresh_token: 'r',
          user: { id: 'sb-1', email: 'bad@test.com', user_metadata: {} },
          expires_in: 3600,
        } as any,
      },
      error: null,
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 }),
    );

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    expect(screen.getByTestId('auth').textContent).toBe('no');
  });

  it('login sets user and isAuthenticated', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: {
          access_token: 'new-token',
          refresh_token: 'new-r',
          user: { id: 'sb-1', email: 't@t.com', user_metadata: {} },
          expires_in: 3600,
        } as any,
        user: { id: 'sb-1', email: 't@t.com', user_metadata: {} } as any,
      },
      error: null,
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        success: true,
        data: { id: '1', email: 't@t.com', name: 'Tester', role: 'ADMIN' },
      }), { status: 200 }),
    );

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    await act(async () => { screen.getByTestId('btn-login').click(); });
    expect(screen.getByTestId('auth').textContent).toBe('yes');
    expect(screen.getByTestId('user').textContent).toBe('Tester');
  });

  it('login returns error on failure', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null } as any,
      error: { name: 'AuthError', message: 'Invalid login credentials', status: 400 } as any,
    });

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    await act(async () => { screen.getByTestId('btn-login').click(); });
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('logout clears user and isAuthenticated', async () => {
    // First login
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: {
          access_token: 't', refresh_token: 'r',
          user: { id: 'sb-1', email: 'a@b.com', user_metadata: {} },
          expires_in: 3600,
        } as any,
        user: { id: 'sb-1', email: 'a@b.com', user_metadata: {} } as any,
      },
      error: null,
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        success: true,
        data: { id: '1', email: 'a@b.com', name: 'User', role: 'ADMIN' },
      }), { status: 200 }),
    );

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    await act(async () => { screen.getByTestId('btn-login').click(); });
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('yes'));

    // Then logout
    await act(async () => { screen.getByTestId('btn-logout').click(); });
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });
});
