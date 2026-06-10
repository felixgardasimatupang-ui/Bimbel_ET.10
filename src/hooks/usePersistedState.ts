import { useState, useEffect, useCallback, useRef } from 'react';
export function usePersistedState<T>(key: string, initialValue: T, options?: { encrypt?: boolean }): [T, React.Dispatch<React.SetStateAction<T>>] {
  const encrypted = options?.encrypt ?? key.startsWith('edu_');
  const mountedRef = useRef(false);

  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return initialValue;
      const raw = encrypted ? JSON.parse(decryptSync(saved)) : JSON.parse(saved);
      return raw;
    } catch {
      return initialValue;
    }
  });

  const handleStorage = useCallback((e: StorageEvent) => {
    if (e.key === key && e.newValue !== null) {
      try {
        const raw = encrypted ? JSON.parse(decryptSync(e.newValue)) : JSON.parse(e.newValue);
        setValue(raw);
      } catch {
        // ignore invalid JSON from other tabs
      }
    }
  }, [key, encrypted]);

  useEffect(() => {
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [handleStorage]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    try {
      const data = JSON.stringify(value);
      const stored = encrypted ? encryptSync(data) : data;
      localStorage.setItem(key, stored);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn(`localStorage penuh untuk key "${key}"`);
      }
    }
  }, [key, value, encrypted]);

  return [value, setValue];
}

function encryptSync(plaintext: string): string {
  try {
    const keyStr = (sessionStorage.getItem('edu_crypto_key') || '').slice(0, 32);
    if (!keyStr) return plaintext;
    let result = '';
    for (let i = 0; i < plaintext.length; i++) {
      const code = plaintext.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length);
      result += String.fromCharCode(code);
    }
    return btoa(result);
  } catch {
    return btoa(unescape(encodeURIComponent(plaintext)));
  }
}

function decryptSync(ciphertext: string): string {
  try {
    const keyStr = (sessionStorage.getItem('edu_crypto_key') || '').slice(0, 32);
    if (!keyStr) {
      try { return decodeURIComponent(escape(atob(ciphertext))); } catch { return ciphertext; }
    }
    const decoded = atob(ciphertext);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const code = decoded.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length);
      result += String.fromCharCode(code);
    }
    return result;
  } catch {
    try { return decodeURIComponent(escape(atob(ciphertext))); } catch { return ciphertext; }
  }
}
