
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

export function useUrlState<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get initial value from URL or localStorage
  const getInitialValue = (): T => {
    try {
      const urlParam = searchParams.get(key);
      if (urlParam) {
        return deserialize(urlParam);
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(`editor_${key}`);
      if (stored) {
        return deserialize(stored);
      }
      
      return defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [value, setValueState] = useState<T>(getInitialValue);

  // Update localStorage whenever value changes
  useEffect(() => {
    if (value !== defaultValue && value !== null && value !== undefined) {
      try {
        localStorage.setItem(`editor_${key}`, serialize(value));
      } catch {
        // Silent fail for localStorage
      }
    } else {
      localStorage.removeItem(`editor_${key}`);
    }
  }, [key, value, defaultValue, serialize]);

  const setValue = useCallback((newValue: T) => {
    setValueState(newValue);
    
    // Only update URL for certain keys (like selected file), not content
    if (key === 'file') {
      try {
        const newParams = new URLSearchParams(searchParams);
        
        if (newValue === defaultValue || newValue === null || newValue === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, serialize(newValue));
        }
        
        const newSearch = newParams.toString();
        const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
        
        // Only navigate if the URL actually changed
        if (newUrl !== `${location.pathname}${location.search}`) {
          setSearchParams(newParams);
        }
      } catch (error) {
        console.warn('Failed to update URL state:', error);
      }
    }
  }, [key, defaultValue, serialize, searchParams, setSearchParams, location]);

  return [value, setValue] as const;
}
