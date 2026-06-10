import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function createStore() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

let storage: ReturnType<typeof createStore>;

beforeEach(() => {
  storage = createStore();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API Client', () => {
  describe('clearTokens', () => {
    it('removes tokens from localStorage', async () => {
      storage.setItem('edu_access_token', 'tok123');
      storage.setItem('edu_refresh_token', 'ref456');
      const { clearTokens } = await import('../api/client');
      clearTokens();
      expect(storage.getItem('edu_access_token')).toBeNull();
      expect(storage.getItem('edu_refresh_token')).toBeNull();
    });

    it('does not throw when nothing stored', async () => {
      const { clearTokens } = await import('../api/client');
      expect(() => clearTokens()).not.toThrow();
    });
  });

  describe('apiRequest', () => {
    it('sends GET request', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: [{ id: '1' }] }), { status: 200 }),
      );
      const { apiRequest } = await import('../api/client');
      const result = await apiRequest('/students');
      expect(result.success).toBe(true);
    });

    it('sends POST with JSON content-type', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );
      globalThis.fetch = mockFetch;
      const { apiRequest } = await import('../api/client');
      await apiRequest('/test', { method: 'POST', body: { foo: 'bar' } });
      const args = mockFetch.mock.calls[0][1];
      expect(args.method).toBe('POST');
      expect(args.body).toBe(JSON.stringify({ foo: 'bar' }));
    });

    it('returns error on bad status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, error: 'Bad request' }), { status: 400 }),
      );
      const { apiRequest } = await import('../api/client');
      const result = await apiRequest('/test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bad request');
    });
  });

  describe('loginApi', () => {
    it('stores tokens on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          data: { user: { id: '1' }, accessToken: 'acc', refreshToken: 'ref' },
        }), { status: 200 }),
      );
      const { loginApi } = await import('../api/client');
      const result = await loginApi('admin@test.com', 'pass');
      expect(result.success).toBe(true);
      expect(storage.getItem('edu_access_token')).toBe('acc');
    });

    it('returns error on failed login', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, error: 'Invalid' }), { status: 401 }),
      );
      const { loginApi } = await import('../api/client');
      const result = await loginApi('wrong@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(storage.getItem('edu_access_token')).toBeNull();
    });
  });
});
