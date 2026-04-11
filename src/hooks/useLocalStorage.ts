import { useState } from 'react';

/**
 * Hook pour gérer les données dans localStorage avec gestion d'erreurs
 * Gère les dépassements de quota et fallback gracieux
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`Failed to read from localStorage[${key}]:`, error);
    }
    return initialValue;
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      try {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (storageError) {
        if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
          console.error(`localStorage quota exceeded for key: ${key}`);
          // Note: In a real app, you might want to trigger a toast notification here
          // For now, we just update in-memory state
        } else {
          throw storageError;
        }
      }
    } catch (error) {
      console.error(`Failed to write to localStorage[${key}]:`, error);
    }
  };

  return [storedValue, setValue];
}
