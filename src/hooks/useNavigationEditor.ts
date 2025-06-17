
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navigationService, NavigationStructure } from '@/services/navigationService';

export function useNavigationEditor() {
  const {
    data: navigation,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['navigation-structure-editor', 'v1'],
    queryFn: () => navigationService.getNavigationStructureForEditor(),
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for editor)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    navigation: navigation || { sections: [] },
    isLoading,
    error,
    refetch
  };
}
