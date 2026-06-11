import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const API_BASE = 'http://localhost:3001/api';

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.stubGlobal('import.meta', { env: { VITE_API_URL: API_BASE } });
  const client = await import('../api/client');
  client.clearTokens();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API Client', () => {
  describe('clearTokens', () => {
    it('clears access token', async () => {
      const client = await import('../api/client');
      client.setAccessToken('tok123');
      expect(client.getAccessToken()).toBe('tok123');
      client.clearTokens();
      expect(client.getAccessToken()).toBeNull();
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
    it('stores access token in memory on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          data: { user: { id: '1' }, accessToken: 'acc' },
        }), { status: 200 }),
      );
      const client = await import('../api/client');
      const result = await client.loginApi('admin@test.com', 'pass');
      expect(result.success).toBe(true);
      expect(client.getAccessToken()).toBe('acc');
    });

    it('returns error on failed login', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, error: 'Invalid' }), { status: 401 }),
      );
      const client = await import('../api/client');
      const result = await client.loginApi('wrong@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(client.getAccessToken()).toBeNull();
    });
  });
});
