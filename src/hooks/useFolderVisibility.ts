
import { useState, useCallback } from 'react';
import { navigationService } from '@/services/navigationService';

export interface FolderVisibilityState {
  [folderPath: string]: boolean;
}

export function useFolderVisibility() {
  const [folderVisibility, setFolderVisibility] = useState<FolderVisibilityState>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateFolderVisibility = useCallback(async (folderPath: string, isPublic: boolean) => {
    setIsLoading(true);
    try {
      // Update all navigation items that belong to this folder
      await navigationService.updateFolderVisibility(folderPath, isPublic);
      
      // Update local state
      setFolderVisibility(prev => ({
        ...prev,
        [folderPath]: isPublic
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to update folder visibility:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFolderVisibility = useCallback((folderPath: string): boolean => {
    return folderVisibility[folderPath] ?? true; // Default to public
  }, [folderVisibility]);

  const initializeFolderVisibility = useCallback((folders: { path: string; isPublic: boolean }[]) => {
    const initialState: FolderVisibilityState = {};
    folders.forEach(folder => {
      initialState[folder.path] = folder.isPublic;
    });
    setFolderVisibility(initialState);
  }, []);

  return {
    folderVisibility,
    updateFolderVisibility,
    getFolderVisibility,
    initializeFolderVisibility,
    isLoading
  };
}
