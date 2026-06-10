const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

function getTokens() {
  try {
    const access = localStorage.getItem('edu_access_token');
    const refresh = localStorage.getItem('edu_refresh_token');
    return { access, refresh };
  } catch {
    return { access: null, refresh: null };
  }
}

function setTokens(access: string, refresh: string) {
  try {
    localStorage.setItem('edu_access_token', access);
    localStorage.setItem('edu_refresh_token', refresh);
  } catch {
    // silently fail
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem('edu_access_token');
    localStorage.removeItem('edu_refresh_token');
  } catch {
    // silently fail
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    if (data.success) {
      setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiRequest<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  const { access } = getTokens();
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (access) {
    headers['Authorization'] = `Bearer ${access}`;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && access) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    }
  }

  const json = await res.json().catch(() => ({ success: false, error: 'Gagal parse response' }));
  return json;
}

interface AuthResponse {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

export async function loginApi(email: string, password: string) {
  const result = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (result.success && result.data) {
    setTokens(result.data.accessToken, result.data.refreshToken);
  }
  return result;
}

export async function registerApi(email: string, password: string, name: string) {
  const result = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { email, password, name },
  });
  if (result.success && result.data) {
    setTokens(result.data.accessToken, result.data.refreshToken);
  }
  return result;
}

export async function getMe() {
  return apiRequest('/auth/me', { method: 'POST' });
}
