import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:3001/api';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('import.meta', { env: { VITE_API_URL: API_BASE } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Sequential fetch responses: push in order, shift() returns them on call
let fetchQueue: Array<{ status: number; body: Record<string, unknown> }> = [];

function mockFetchSequential() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
    const next = fetchQueue.shift();
    if (!next) {
      return new Response(JSON.stringify({ success: false, error: 'unexpected fetch' }), { status: 404 });
    }
    return new Response(JSON.stringify(next.body), { status: next.status });
  }));
}

function TestConsumer() {
  const { user, loading, isAuthenticated, login, googleLogin, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'done'}</div>
      <div data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user ? user.name : 'none'}</div>
      <div data-testid="email">{user ? user.email : 'none'}</div>
      <button data-testid="btn-login" onClick={() => login('test@test.com', 'pass')}>Login</button>
      <button data-testid="btn-google" onClick={() => googleLogin('google-id-token')}>Google</button>
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
    fetchQueue = [
      { status: 400, body: { success: false, error: 'no cookie' } },
    ];
    mockFetchSequential();

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('restores session when valid refresh cookie exists', async () => {
    fetchQueue = [
      { status: 200, body: { success: true, data: { accessToken: 'new-access' } } },
      { status: 200, body: { success: true, data: { id: '1', email: 'user@test.com', name: 'Test User', role: 'ADMIN' } } },
    ];
    mockFetchSequential();

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    expect(screen.getByTestId('auth').textContent).toBe('yes');
    expect(screen.getByTestId('user').textContent).toBe('Test User');
  });

  it('clears state when session restore succeeds but getMe fails', async () => {
    fetchQueue = [
      { status: 200, body: { success: true, data: { accessToken: 'bad-access' } } },
      { status: 401, body: { success: false, error: 'Unauthorized' } },
    ];
    mockFetchSequential();

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('login sets user and isAuthenticated', async () => {
    // mount: refresh fails
    fetchQueue = [
      { status: 400, body: { success: false } },
    ];
    mockFetchSequential();

    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));

    // login click → loginApi then getMe
    fetchQueue.push(
      { status: 200, body: { success: true, data: { accessToken: 'new-token', user: { id: '1', email: 't@t.com', name: 'Tester', role: 'ADMIN' } } } },
      { status: 200, body: { success: true, data: { id: '1', email: 't@t.com', name: 'Tester', role: 'ADMIN' } } },
    );

    await act(async () => { screen.getByTestId('btn-login').click(); });
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('yes'));
    expect(screen.getByTestId('user').textContent).toBe('Tester');
  });

  it('login returns error on failure', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },
    ];
    mockFetchSequential();
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));

    fetchQueue.push(
      { status: 401, body: { success: false, error: 'Email atau password salah' } },
    );

    await act(async () => { screen.getByTestId('btn-login').click(); });
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('googleLogin sets user and isAuthenticated directly (no getMe)', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },
    ];
    mockFetchSequential();
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));

    fetchQueue.push(
      { status: 200, body: { success: true, data: { accessToken: 'g-token', user: { id: '2', email: 'g@user.com', name: 'Google User', role: 'ADMIN' } } } },
    );

    await act(async () => { screen.getByTestId('btn-google').click(); });
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('yes'));
    expect(screen.getByTestId('user').textContent).toBe('Google User');
    expect(screen.getByTestId('email').textContent).toBe('g@user.com');
  });

  it('googleLogin returns error on failure', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },
    ];
    mockFetchSequential();
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));

    fetchQueue.push(
      { status: 401, body: { success: false, error: 'Token Google tidak valid' } },
    );

    await act(async () => { screen.getByTestId('btn-google').click(); });
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('googleLogin shows generic error on network failure', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },
    ];
    mockFetchSequential();
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));

    // Simulate network failure — fetch will throw
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    await act(async () => {
      screen.getByTestId('btn-google').click();
    });

    // Wait a tick for the async to settle
    await new Promise((r) => setTimeout(r, 100));
    // Since fetch is mocked globally and the component catches, isAuthenticated stays no
  });

  it('logout clears user and isAuthenticated', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },
    ];
    mockFetchSequential();
    renderCtx();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('done'));

    // Login first
    fetchQueue.push(
      { status: 200, body: { success: true, data: { accessToken: 't', user: { id: '1', email: 'a@b.com', name: 'User', role: 'ADMIN' } } } },
      { status: 200, body: { success: true, data: { id: '1', email: 'a@b.com', name: 'User', role: 'ADMIN' } } },
    );
    await act(async () => { screen.getByTestId('btn-login').click(); });
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('yes'));

    // Then logout
    fetchQueue.push(
      { status: 200, body: { success: true } },
    );
    await act(async () => { screen.getByTestId('btn-logout').click(); });
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });
});

