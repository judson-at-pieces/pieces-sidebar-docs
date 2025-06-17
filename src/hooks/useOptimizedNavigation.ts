
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navigationService, NavigationStructure } from '@/services/navigationService';

export function useOptimizedNavigation() {
  const {
    data: navigation,
    isLoading,
    error
  } = useQuery({
    queryKey: ['navigation-structure-optimized', 'v3'],
    queryFn: () => navigationService.getNavigationStructure(),
    staleTime: 10 * 60 * 1000, // 10 minutes for public navigation
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
  });

  // Memoize the processed navigation structure
  const memoizedNavigation = useMemo(() => {
    if (!navigation?.sections) return { sections: [] };
    
    // Pre-process navigation for faster rendering
    return {
      sections: navigation.sections.map(section => ({
        ...section,
        itemCount: section.items?.length || 0,
        // Pre-calculate if section has nested items for faster rendering
        hasNestedItems: section.items?.some(item => item.items && item.items.length > 0) || false
      }))
    };
  }, [navigation]);

  return {
    navigation: memoizedNavigation,
    isLoading,
    error
  };
}
