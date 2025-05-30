
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navigationService, NavigationStructure } from '@/services/navigationService';

export function useNavigation() {
  const {
    data: navigation,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['navigation-structure'],
    queryFn: () => navigationService.getNavigationStructure(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    navigation: navigation || { sections: [] },
    isLoading,
    error,
    refetch
  };
}
