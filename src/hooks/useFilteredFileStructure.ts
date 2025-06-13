
import { useState, useEffect, useCallback } from 'react';
import { FileNode } from '@/utils/fileSystem';
import { useDocumentPublicity } from './useDocumentPublicity';

export function useFilteredFileStructure(fileStructure: FileNode[]) {
  const [filteredStructure, setFilteredStructure] = useState<FileNode[]>(fileStructure);
  const [isLoading, setIsLoading] = useState(false);
  const { getPublicDocuments } = useDocumentPublicity();

  const filterFileStructure = useCallback(async (structure: FileNode[]): Promise<FileNode[]> => {
    const publicDocuments = await getPublicDocuments();
    const publicPaths = new Set(publicDocuments.map(doc => doc.file_path));

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .map(node => {
          if (node.type === 'folder') {
            // For folders, recursively filter children
            const filteredChildren = node.children ? filterNodes(node.children) : [];
            // Only include folder if it has visible children
            if (filteredChildren.length > 0) {
              return { ...node, children: filteredChildren };
            }
            return null;
          } else {
            // For files, check if they're public or if no publicity is set (default to visible)
            const isPublic = publicPaths.has(node.path) || !publicDocuments.some(doc => doc.file_path === node.path);
            return isPublic ? node : null;
          }
        })
        .filter((node): node is FileNode => node !== null);
    };

    return filterNodes(structure);
  }, [getPublicDocuments]);

  const refreshFilteredStructure = useCallback(async () => {
    setIsLoading(true);
    try {
      const filtered = await filterFileStructure(fileStructure);
      setFilteredStructure(filtered);
    } catch (error) {
      console.error('Error filtering file structure:', error);
      // Fallback to original structure if filtering fails
      setFilteredStructure(fileStructure);
    } finally {
      setIsLoading(false);
    }
  }, [fileStructure, filterFileStructure]);

  useEffect(() => {
    refreshFilteredStructure();
  }, [refreshFilteredStructure]);

  return {
    filteredStructure,
    isLoading,
    refreshFilteredStructure
  };
}
