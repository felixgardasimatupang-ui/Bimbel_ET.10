import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

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
  it('shows done and not authenticated when no token', async () => {
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('restores session when valid token exists', async () => {
    storage.setItem('edu_access_token', 'exists');
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

  it('clears token state when getMe fails', async () => {
    storage.setItem('edu_access_token', 'bad');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 }),
    );
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    expect(screen.getByTestId('auth').textContent).toBe('no');
  });

  it('login sets user and isAuthenticated', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        success: true,
        data: { user: { id: '1', email: 't@t.com', name: 'Tester', role: 'ADMIN' }, accessToken: 'a', refreshToken: 'r' },
      }), { status: 200 }),
    );
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    await act(async () => { screen.getByTestId('btn-login').click(); });
    expect(screen.getByTestId('auth').textContent).toBe('yes');
    expect(screen.getByTestId('user').textContent).toBe('Tester');
  });

  it('login returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), { status: 401 }),
    );
    const { loginApi } = await import('../api/client');
    const result = await loginApi('x', 'y');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('logout clears user and isAuthenticated', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        success: true,
        data: { user: { id: '1', email: 'a@b.com', name: 'User', role: 'ADMIN' }, accessToken: 'a', refreshToken: 'r' },
      }), { status: 200 }),
    );
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    await act(async () => { screen.getByTestId('btn-login').click(); });
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('yes'));
    await act(async () => { screen.getByTestId('btn-logout').click(); });
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });
});
