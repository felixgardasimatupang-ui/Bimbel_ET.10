import { useEffect, useCallback, useRef } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;
type KeyMap = Record<string, KeyHandler>;

export function useKeyboard(keyMap: KeyMap, enabled = true) {
  const keyMapRef = useRef(keyMap);
  keyMapRef.current = keyMap;

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      const key = e.key;
      const handler_ = keyMapRef.current[key];
      if (handler_) {
        e.preventDefault();
        handler_(e);
      }
    },
    [enabled],
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}

export function useEscapeKey(handler: () => void, enabled = true) {
  useKeyboard({ Escape: handler }, enabled);
}

export function useEnterKey(handler: () => void, enabled = true) {
  useKeyboard({ Enter: handler }, enabled);
}
