
import { useQuery } from '@tanstack/react-query';
import { navigationService } from '@/services/navigationService';

export function useNavigationEditor() {
  const {
    data: navigation,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['navigation-structure-editor', 'v1'],
    queryFn: () => navigationService.getNavigationStructureForEditor(),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    navigation: navigation || { sections: [] },
    isLoading,
    error,
    refetch
  };
}
