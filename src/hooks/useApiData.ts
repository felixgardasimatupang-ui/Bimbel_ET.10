import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../api/client';
import { encrypt, decrypt } from '../utils/crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000;

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(await decrypt(raw));
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    const encrypted = await encrypt(JSON.stringify(entry));
    localStorage.setItem(key, encrypted);
  } catch {
    // silently fail
  }
}

function invalidateCache(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // silently fail
  }
}

interface UseApiDataOptions<T> {
  initialData: T;
  cacheKey?: string;
  onError?: (error: string) => void;
}

interface UseApiDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T>>;
}

export function useApiData<T>(
  endpoint: string | null,
  options: UseApiDataOptions<T>,
): UseApiDataResult<T> {
  const { initialData, cacheKey, onError } = options;
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);

    try {
      const cached = cacheKey ? await cacheGet<T>(cacheKey) : null;
      if (cached) {
        setData(cached);
      }

      const result = await apiRequest<T>(endpoint);
      if (!mountedRef.current) return;

      if (result.success && result.data) {
        setData(result.data);
        if (cacheKey) cacheSet(cacheKey, result.data);
      } else {
        if (!cached) {
          setError(result.error || 'Gagal memuat data');
          onError?.(result.error || 'Gagal memuat data');
        }
      }
    } catch {
      if (!mountedRef.current) return;
      const cached = cacheKey ? await cacheGet<T>(cacheKey) : null;
      if (!cached) {
        setError('Gagal terhubung ke server');
        onError?.('Gagal terhubung ke server');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [endpoint, cacheKey, onError]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}

export function invalidateApiCache(key: string) {
  invalidateCache(key);
}

export { invalidateCache };
