import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('useLocalStorage: failed to persist', key, e);
    }
  }, [key, value]);

  const remove = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, setValue, remove];
}
