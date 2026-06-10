import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '../hooks/usePersistedState';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorage.clear();
});

describe('usePersistedState', () => {
  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => usePersistedState('test_key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem('test_key', JSON.stringify('stored'));
    const { result } = renderHook(() => usePersistedState('test_key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('writes to localStorage when value changes', () => {
    const { result } = renderHook(() => usePersistedState('test_key', 'default'));
    act(() => { result.current[1]('updated'); });
    expect(localStorage.getItem('test_key')).toBe('"updated"');
  });

  it('returns initial value on JSON parse error', () => {
    localStorage.setItem('test_key', 'invalid-json');
    const { result } = renderHook(() => usePersistedState('test_key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('handles object values', () => {
    const initial = { a: 1, b: 'hello' };
    const { result } = renderHook(() => usePersistedState('obj_key', initial));
    expect(result.current[0]).toEqual(initial);

    act(() => { result.current[1]({ a: 2, b: 'world' }); });
    expect(JSON.parse(localStorage.getItem('obj_key') || '{}')).toEqual({ a: 2, b: 'world' });
  });

  it('syncs value when storage event fires from another tab', () => {
    const { result } = renderHook(() => usePersistedState('sync_key', 'default'));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'sync_key',
        newValue: '"synced-value"',
      }));
    });
    expect(result.current[0]).toBe('synced-value');
  });

  it('ignores storage event for different key', () => {
    const { result } = renderHook(() => usePersistedState('my_key', 'original'));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'other_key',
        newValue: '"should-ignore"',
      }));
    });
    expect(result.current[0]).toBe('original');
  });
});
