
import { useState, useEffect } from 'react';
import { FileNode, loadContentStructure } from '@/utils/fileSystem';

export function useFileStructure() {
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const structure = await loadContentStructure();
      setFileStructure(structure);
    } catch (err) {
      setError(err as Error);
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
