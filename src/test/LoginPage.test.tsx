import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import LoginPage from '../components/LoginPage';
import { getGoogleClientId } from '../config';

const API_BASE = 'http://localhost:3001/api';

vi.mock('../config', () => ({
  getGoogleClientId: vi.fn(() => ''),
}));

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
  vi.stubGlobal('import.meta', {
    env: { VITE_API_URL: API_BASE, VITE_GOOGLE_CLIENT_ID: '' },
  });
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

describe('LoginPage — Landing Page Layout', () => {
  it('renders brand identity and tagline', () => {
    fetchQueue = [{ status: 400, body: { success: false } }];
    mockFetchSequential();
    renderLogin();

    expect(screen.getByText('EduAdmin')).toBeTruthy();
    expect(screen.getByText('Bimbel Management System')).toBeTruthy();
    expect(screen.getByText('Selamat Datang')).toBeTruthy();
  });

  it('renders login form with empty fields', () => {
    fetchQueue = [{ status: 400, body: { success: false } }];
    mockFetchSequential();
    renderLogin();

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('');
    const passInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passInput.value).toBe('');
  });

  it('renders all 6 feature cards on desktop', () => {
    fetchQueue = [{ status: 400, body: { success: false } }];
    mockFetchSequential();
    renderLogin();

    expect(screen.getByText('Manajemen Siswa')).toBeTruthy();
    expect(screen.getByText('Kelola Pengajar')).toBeTruthy();
    expect(screen.getByText('SPP & Keuangan')).toBeTruthy();
    expect(screen.getByText('Materi Belajar')).toBeTruthy();
    expect(screen.getByText('Hak Akses')).toBeTruthy();
    expect(screen.getByText('Notifikasi')).toBeTruthy();
  });

  it('does NOT render Google button when GOOGLE_CLIENT_ID is empty', () => {
    fetchQueue = [{ status: 400, body: { success: false } }];
    mockFetchSequential();
    renderLogin();

    expect(screen.queryByText('atau masuk dengan')).toBeNull();
  });

  it('renders terms and privacy text', () => {
    fetchQueue = [{ status: 400, body: { success: false } }];
    mockFetchSequential();
    renderLogin();

    expect(screen.getByText('Ketentuan Layanan')).toBeTruthy();
    expect(screen.getByText('Kebijakan Privasi')).toBeTruthy();
  });

  it('renders trust indicator with aman & terenkripsi', () => {
    fetchQueue = [{ status: 400, body: { success: false } }];
    mockFetchSequential();
    renderLogin();
    expect(screen.getByText('Aman & Terenkripsi')).toBeTruthy();
  });
});

describe('LoginPage — Email/Password Form', () => {
  it('shows error message on failed login', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },
      { status: 401, body: { success: false, error: 'Email atau password salah' } },
    ];
    mockFetchSequential();
    renderLogin();

    await waitFor(() => expect(screen.queryByText('Memproses...')).toBeFalsy());

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@bimbel.edu' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin123' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Masuk'));
    });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText('Email atau password salah')).toBeTruthy();
  });

  it('calls login with entered credentials', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },
      { status: 200, body: { success: true, data: { accessToken: 'a', user: { id: '1', email: 'custom@test.com', name: 'Custom', role: 'ADMIN' } } } },
      { status: 200, body: { success: true, data: { id: '1', email: 'custom@test.com', name: 'Custom', role: 'ADMIN' } } },
    ];
    mockFetchSequential();
    renderLogin();

    await waitFor(() => expect(screen.queryByText('Memproses...')).toBeFalsy());

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'custom@test.com' } });
    const passInput = screen.getByLabelText(/password/i);
    fireEvent.change(passInput, { target: { value: 'custompass' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Masuk'));
    });
    await waitFor(() => {
      expect(screen.queryByText('Memproses...')).toBeFalsy();
    });
  });

  it('disables button while loading', async () => {
    const slowResponse = new Promise<Response>((resolve) => setTimeout(() => resolve(
      new Response(JSON.stringify({ success: true, data: { accessToken: 'a', user: { id: '1', email: 'a@b.com', name: 'U', role: 'ADMIN' } } }), { status: 200 }),
    ), 500));

    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 400 }));
      return slowResponse;
    }));

    renderLogin();
    await waitFor(() => expect(screen.queryByText('Memproses...')).toBeFalsy());

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } });

    await act(async () => { fireEvent.click(screen.getByText('Masuk')); });
    const btn = screen.getByText('Memproses...');
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows error alert with custom error message', async () => {
    fetchQueue = [
      { status: 400, body: { success: false } },
      { status: 500, body: { success: false, error: 'Server error' } },
    ];
    mockFetchSequential();
    renderLogin();

    await waitFor(() => expect(screen.queryByText('Memproses...')).toBeFalsy());
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'x@y.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    await act(async () => { fireEvent.click(screen.getByText('Masuk')); });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText('Server error')).toBeTruthy();
  });
});

describe('LoginPage — Google Sign-In', () => {
  beforeEach(() => {
    vi.mocked(getGoogleClientId).mockReturnValue('test-client-id');
  });

  it('renders "atau masuk dengan" divider when Google enabled', () => {
    fetchQueue = [{ status: 400, body: { success: false } }];
    mockFetchSequential();
    renderLogin();
    expect(screen.getByText('atau masuk dengan')).toBeTruthy();
  });

  it('shows spinner while googleLogin is in progress', async () => {
    // Mock google.accounts.id
    const renderButtonMock = vi.fn();
    const initializeMock = vi.fn(({ callback }) => {
      // Simulate user clicking Google sign-in after a delay
      setTimeout(() => callback({ credential: 'google-id-token' }), 50);
    });
    vi.stubGlobal('google', {
      accounts: { id: { initialize: initializeMock, renderButton: renderButtonMock, prompt: vi.fn() } },
    });

    fetchQueue = [
      { status: 400, body: { success: false } },
      { status: 200, body: { success: true, data: { accessToken: 't', user: { id: '1', email: 'g@user.com', name: 'Google User', role: 'ADMIN' } } } },
    ];
    mockFetchSequential();
    renderLogin();

    await waitFor(() => {
      expect(screen.queryByText('atau masuk dengan')).toBeTruthy();
    });
  });

  it('sends idToken to backend on Google credential response', async () => {
    let capturedBody = '';
    vi.stubGlobal('google', {
      accounts: {
        id: {
          initialize: vi.fn(({ callback }) => {
            callback({ credential: 'google-id-token-123' });
          }),
          renderButton: vi.fn(),
          prompt: vi.fn(),
        },
      },
    });

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts: any) => {
      if (url.includes('/auth/refresh')) {
        return new Response(JSON.stringify({ success: false }), { status: 400 });
      }
      if (url.includes('/auth/google')) {
        capturedBody = opts.body;
        return new Response(
          JSON.stringify({ success: true, data: { accessToken: 'g-token', user: { id: '2', email: 'g@user.com', name: 'Google U', role: 'ADMIN' } } }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    }));

    renderLogin();

    await waitFor(() => {
      expect(capturedBody).toBeTruthy();
      const parsed = JSON.parse(capturedBody);
      expect(parsed.idToken).toBe('google-id-token-123');
    });
  });

  it('shows error when googleLogin fails', async () => {
    vi.stubGlobal('google', {
      accounts: {
        id: {
          initialize: vi.fn(({ callback }) => {
            callback({ credential: 'bad-token' });
          }),
          renderButton: vi.fn(),
          prompt: vi.fn(),
        },
      },
    });

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/auth/refresh')) return new Response(JSON.stringify({ success: false }), { status: 400 });
      if (url.includes('/auth/google')) return new Response(
        JSON.stringify({ success: false, error: 'Token Google tidak valid' }),
        { status: 401 },
      );
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    }));

    renderLogin();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText('Token Google tidak valid')).toBeTruthy();
  });
});
