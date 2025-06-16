
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/services/analyticsService';

export function useAnalytics() {
  const location = useLocation();

  // Track page views automatically
  useEffect(() => {
    const trackPageView = async () => {
      await analyticsService.trackPageView(location.pathname);
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
