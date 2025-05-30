
import { useState, useEffect } from 'react';
import { loadContentStructure, FileNode } from '@/utils/fileSystem';

export { FileNode };

export function useFileStructure() {
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the existing loadContentStructure function which works with content-index.json
      const structure = await loadContentStructure();
      setFileStructure(structure);
      
    } catch (err) {
      console.error('Failed to load file structure:', err);
      setError(err as Error);
      
      // Fallback to empty structure if everything fails
      setFileStructure([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    fileStructure,
    isLoading,
    error,
    refetch
  };
}
