import type { Siswa, Teacher, Transaksi, MateriBelajar, Notifikasi, Schedule } from '../types';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '') + '/api'
  : '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearTokens() {
  accessToken = null;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          accessToken = data.data.accessToken;
          return accessToken;
        }
      }
    } catch {
      // fall through
    }

    accessToken = null;
    return null;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiRequest<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: 'include',
      });
    }
  }

  const json = await res.json().catch(() => ({ success: false, error: 'Gagal parse response' }));
  return json;
}

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  const result = await res.json().catch(() => ({ success: false, error: 'Gagal parse response' }));
  if (result.success) {
    accessToken = result.data.accessToken;
  }
  return result;
}

export async function registerApi(email: string, password: string, name: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
    credentials: 'include',
  });
  const result = await res.json().catch(() => ({ success: false, error: 'Gagal parse response' }));
  if (result.success) {
    accessToken = result.data.accessToken;
  }
  return result;
}

export async function googleLoginApi(idToken: string) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    credentials: 'include',
  });
  const result = await res.json().catch(() => ({ success: false, error: 'Gagal parse response' }));
  if (result.success) {
    accessToken = result.data.accessToken;
  }
  return result;
}

export async function logoutApi() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  accessToken = null;
}

export async function getMe() {
  return apiRequest('/auth/me');
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
