
import { useState, useEffect } from 'react';
import { loadContentStructure, getAllFilePaths, type FileNode } from '@/utils/fileSystem';

export type { FileNode };

export function useFileStructure() {
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalFiles, setTotalFiles] = useState(0);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Refetching file structure...');
      
      // Use the existing loadContentStructure function which works with content-index.json
      const structure = await loadContentStructure();
      setFileStructure(structure);
      
      // Count total files for debugging
      const allPaths = getAllFilePaths(structure);
      setTotalFiles(allPaths.length);
      
      console.log('📊 File structure loaded:', {
        totalStructureNodes: structure.length,
        totalFiles: allPaths.length,
        samplePaths: allPaths.slice(0, 10)
      });
      
    } catch (err) {
      console.error('Failed to load file structure:', err);
      setError(err as Error);
      
      // Fallback to empty structure if everything fails
      setFileStructure([]);
      setTotalFiles(0);
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
    totalFiles,
    refetch
  };
}
