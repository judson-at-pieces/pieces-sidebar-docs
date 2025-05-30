
import { useState, useEffect } from 'react';

// Define a simple FileNode type if the import fails
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export function useFileStructure() {
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, let's provide a mock structure to prevent infinite loading
      // This can be replaced with actual file system loading later
      const mockStructure: FileNode[] = [
        {
          name: 'content',
          path: 'content',
          type: 'folder',
          children: [
            {
              name: 'getting-started.md',
              path: 'content/getting-started.md',
              type: 'file'
            },
            {
              name: 'guides',
              path: 'content/guides',
              type: 'folder',
              children: [
                {
                  name: 'quick-start.md',
                  path: 'content/guides/quick-start.md',
                  type: 'file'
                }
              ]
            }
          ]
        }
      ];
      
      setFileStructure(mockStructure);
    } catch (err) {
      setError(err as Error);
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
