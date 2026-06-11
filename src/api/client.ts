import { supabase } from '../lib/supabase';
import type { Siswa, Teacher, Transaksi, MateriBelajar, Notifikasi, Schedule } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface Tokens {
  access: string | null;
  refresh: string | null;
}

function getTokens(): Tokens {
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
    sessionStorage.removeItem('edu_crypto_key');
  } catch {
    // silently fail
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (refresh) {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTokens(data.data.accessToken, data.data.refreshToken);
          return data.data.accessToken;
        }
      }
    } catch {
      // fall through
    }
  }

  // Fallback: try Supabase session refresh
  try {
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      setTokens(data.session.access_token, data.session.refresh_token);
      return data.session.access_token;
    }
  } catch {
    // silent
  }

  clearTokens();
  return null;
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

// Students API
export const StudentsApi = {
  list: (params?: { search?: string; classFilter?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.classFilter) qs.set('classFilter', params.classFilter);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest<{ data: Siswa[]; pagination: Record<string, unknown> }>(`/students${query ? `?${query}` : ''}`);
  },
  get: (id: string) => apiRequest<Siswa>(`/students/${id}`),
  create: (data: Partial<Siswa>) => apiRequest<Siswa>('/students', { method: 'POST', body: data }),
  toggleSpp: (id: string) => apiRequest<Siswa>(`/students/${id}/toggle-spp`, { method: 'PUT' }),
  checkin: (id: string, method?: string) => apiRequest<Siswa>(`/students/${id}/checkin`, { method: 'PUT', body: { method: method || 'QR_SCAN' } }),
};

// Teachers API
export const TeachersApi = {
  list: () => apiRequest<{ data: Teacher[] }>('/teachers'),
  evaluate: (id: string, data: { pedagogical: number; professional: number; social: number; feedback: string }) =>
    apiRequest<Teacher>(`/teachers/evaluate/${id}`, { method: 'POST', body: data }),
};

// Finance API
export const FinanceApi = {
  transactions: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest<{ data: Transaksi[]; pagination: Record<string, unknown> }>(`/finance/transactions${query ? `?${query}` : ''}`);
  },
  summary: () => apiRequest<{
    totalExpected: number;
    totalCollected: number;
    percentCollected: number;
    operationalCosts: Array<{ itemName: string; totalCost: number; siswaShare: number; category: string }>;
    totalOperationalCost: number;
  }>('/finance/summary'),
  studentTransactions: (studentId: string) => apiRequest<Transaksi[]>(`/finance/students/${studentId}/transactions`),
};

// Materials API
export const MaterialsApi = {
  list: (params?: { search?: string; subjectFilter?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.subjectFilter) qs.set('subjectFilter', params.subjectFilter);
    const query = qs.toString();
    return apiRequest<{ data: MateriBelajar[] }>(`/materials${query ? `?${query}` : ''}`);
  },
  create: (data: Partial<MateriBelajar>) => apiRequest<MateriBelajar>('/materials', { method: 'POST', body: data }),
  download: (id: string) => apiRequest<MateriBelajar>(`/materials/${id}/download`, { method: 'PUT' }),
};

// Notifications API
export const NotificationsApi = {
  list: () => apiRequest<{ data: Notifikasi[] }>('/notifications'),
  sppReminder: () => apiRequest('/notifications/spp-reminder', { method: 'POST' }),
  examReminder: () => apiRequest('/notifications/exam-reminder', { method: 'POST' }),
};

// Schedules API
export const SchedulesApi = {
  list: () => apiRequest<{ data: Schedule[] }>('/schedules'),
};

// Audit Logs API
export const AuditLogsApi = {
  list: (params?: { action?: string; entity?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.entity) qs.set('entity', params.entity);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest<{ data: Array<Record<string, unknown>>; pagination: Record<string, unknown> }>(`/audit-logs${query ? `?${query}` : ''}`);
  },
};
