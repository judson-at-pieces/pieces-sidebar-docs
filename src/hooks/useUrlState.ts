
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlState<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = (() => {
    try {
      const param = searchParams.get(key);
      return param ? deserialize(param) : defaultValue;
    } catch {
      return defaultValue;
    }
  })();

  const setValue = useCallback((newValue: T) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (newValue === defaultValue || newValue === null || newValue === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, serialize(newValue));
      }
      return newParams;
    });
  }, [key, defaultValue, serialize, setSearchParams]);

  return [value, setValue] as const;
}
