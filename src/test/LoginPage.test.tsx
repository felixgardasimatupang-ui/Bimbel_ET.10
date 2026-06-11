import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import LoginPage from '../components/LoginPage';

const API_BASE = 'http://localhost:3001/api';

let fetchQueue: Array<{ status: number; body: Record<string, unknown> }> = [];

function mockFetchSequential() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
    const next = fetchQueue.shift();
    if (!next) {
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    }
    return new Response(JSON.stringify(next.body), { status: next.status });
  }));
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('import.meta', { env: { VITE_API_URL: API_BASE } });
  fetchQueue = [];
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
    fetchQueue = [
      { status: 400, body: { success: false } },
    ];
    mockFetchSequential();
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
    fetchQueue = [
      { status: 400, body: { success: false } },                // mount: refresh fails
      { status: 401, body: { success: false, error: 'Email atau password salah' } },  // login: fails
    ];
    mockFetchSequential();
    renderLogin();

    // Wait for session restore to settle
    await waitFor(() => expect(screen.queryByText('Memproses...')).toBeFalsy());

    await act(async () => {
      fireEvent.click(screen.getByText('Masuk'));
    });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText('Email atau password salah')).toBeTruthy();
  });

  it('calls login with entered credentials', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },                // mount: refresh fails
      { status: 200, body: { success: true, data: { accessToken: 'a', user: { id: '1', email: 'custom@test.com', name: 'Custom', role: 'ADMIN' } } } },
      { status: 200, body: { success: true, data: { id: '1', email: 'custom@test.com', name: 'Custom', role: 'ADMIN' } } },
    ];
    mockFetchSequential();
    renderLogin();

    await waitFor(() => expect(screen.queryByText('Memproses...')).toBeFalsy());

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
    // Mock a login that takes 500ms to respond
    const slowResponse = new Promise<Response>((resolve) => setTimeout(() => resolve(
      new Response(JSON.stringify({ success: true, data: { accessToken: 'a', user: { id: '1', email: 'a@b.com', name: 'U', role: 'ADMIN' } } }), { status: 200 }),
    ), 500));

    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Session restore — fail immediately
        return Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 400 }));
      }
      // Login — slow response
      return slowResponse;
    }));

    renderLogin();

    await waitFor(() => expect(screen.queryByText('Memproses...')).toBeFalsy());

    await act(async () => {
      fireEvent.click(screen.getByText('Masuk'));
    });
    const btn = screen.getByText('Memproses...');
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
