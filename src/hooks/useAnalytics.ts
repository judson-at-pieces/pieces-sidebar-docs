
import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/services/analyticsService';

export function useAnalytics() {
  const location = useLocation();
  const hasTracked = useRef<Set<string>>(new Set());

  // Track page views automatically with deduplication
  useEffect(() => {
    const trackPageView = async () => {
      // Prevent tracking the same path multiple times in React strict mode
      const pathKey = location.pathname;
      if (hasTracked.current.has(pathKey)) {
        return;
      }
      
      hasTracked.current.add(pathKey);
      await analyticsService.trackPageView(pathKey);
      
      // Clean up old tracked paths to prevent memory leaks
      if (hasTracked.current.size > 50) {
        hasTracked.current.clear();
        hasTracked.current.add(pathKey);
      }
    };

    trackPageView();
  }, [location.pathname]);

  // Function to manually track search queries
  const trackSearch = useCallback(async (query: string, resultsCount: number) => {
    await analyticsService.trackSearch(query, resultsCount);
  }, []);

  return {
    trackSearch,
    trackPageView: (path: string) => analyticsService.trackPageView(path),
  };
}
