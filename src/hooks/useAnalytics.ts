
import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/services/analyticsService';

export function useAnalytics() {
  const location = useLocation();
  const lastTrackedPath = useRef<string>('');

  // Track page views automatically with strict deduplication
  useEffect(() => {
    const trackPageView = async () => {
      const currentPath = location.pathname;
      
      // Prevent tracking the same path multiple times in React strict mode
      if (lastTrackedPath.current === currentPath) {
        console.log(`Skipping duplicate useEffect for ${currentPath}`);
        return;
      }
      
      lastTrackedPath.current = currentPath;
      await analyticsService.trackPageView(currentPath);
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
