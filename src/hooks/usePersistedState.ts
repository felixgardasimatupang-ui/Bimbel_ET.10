import { useState, useEffect, useCallback } from 'react';

export function usePersistedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return initialValue;
      return JSON.parse(saved) as T;
    } catch {
      return initialValue;
    }
  });

  const handleStorage = useCallback((e: StorageEvent) => {
    if (e.key === key && e.newValue !== null) {
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        // ignore invalid JSON from other tabs
      }
    }
  }, [key]);

  useEffect(() => {
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [handleStorage]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn(`localStorage penuh untuk key "${key}"`);
      }
    }
  }, [key, value]);

  return [value, setValue];
}
