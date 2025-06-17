
import { useQuery } from '@tanstack/react-query';
import { navigationService } from '@/services/navigationService';

export function useNavigationEditor() {
  const {
    data: navigation,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['navigation-structure-editor', 'v2'],
    queryFn: () => navigationService.getNavigationStructureForEditor(),
    staleTime: 0, // Always refetch when data is requested
    gcTime: 1 * 60 * 1000, // 1 minute cache time
  });

  return {
    navigation: navigation || { sections: [] },
    isLoading,
    error,
    refetch
  };
}
