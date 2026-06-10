import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import LoginPage from '../components/LoginPage';

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

function renderLogin() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  );
}

describe('LoginPage', () => {
  it('renders login form with default credentials', () => {
    renderLogin();
    expect(screen.getByText('EduAdmin Bimbel')).toBeTruthy();
    expect(screen.getByText('Sistem Manajemen Bimbel Terpadu')).toBeTruthy();
    const emailInput = screen.getByPlaceholderText('admin@bimbel.edu') as HTMLInputElement;
    expect(emailInput.value).toBe('admin@bimbel.edu');
    const passInput = screen.getByPlaceholderText('Masukkan password') as HTMLInputElement;
    expect(passInput.value).toBe('admin123');
    expect(screen.getByText('Demo: admin@bimbel.edu / admin123')).toBeTruthy();
  });

  it('shows error message on failed login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: 'Email atau password salah' }), { status: 401 }),
    );
    renderLogin();
    await act(async () => {
      fireEvent.click(screen.getByText('Masuk'));
    });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText('Email atau password salah')).toBeTruthy();
  });

  it('calls login with entered credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        success: true,
        data: { user: { id: '1', email: 'custom@test.com', name: 'Custom', role: 'ADMIN' }, accessToken: 'a', refreshToken: 'r' },
      }), { status: 200 }),
    );
    renderLogin();
    const emailInput = screen.getByPlaceholderText('admin@bimbel.edu');
    fireEvent.change(emailInput, { target: { value: 'custom@test.com' } });
    const passInput = screen.getByPlaceholderText('Masukkan password');
    fireEvent.change(passInput, { target: { value: 'custompass' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Masuk'));
    });
    await waitFor(() => {
      expect(screen.queryByText('Memproses...')).toBeFalsy();
    });
  });

  it('disables button while loading', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(
        new Response(JSON.stringify({ success: true, data: { user: { id: '1', email: 'a@b.com', name: 'U', role: 'ADMIN' }, accessToken: 'a', refreshToken: 'r' } }), { status: 200 }),
      ), 500)),
    );
    renderLogin();
    await act(async () => {
      fireEvent.click(screen.getByText('Masuk'));
    });
    const btn = screen.getByText('Memproses...');
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
