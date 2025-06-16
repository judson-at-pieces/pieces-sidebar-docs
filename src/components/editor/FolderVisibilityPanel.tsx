
import React from 'react';
import { FileNode } from '@/hooks/useFileStructure';
import { FolderVisibilityControl } from './FolderVisibilityControl';
import { useFolderVisibility } from '@/hooks/useFolderVisibility';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FolderVisibilityPanelProps {
  fileStructure: FileNode[];
  onVisibilityChange?: () => void;
}

export function FolderVisibilityPanel({ fileStructure, onVisibilityChange }: FolderVisibilityPanelProps) {
  const { getFolderVisibility, updateFolderVisibility } = useFolderVisibility();

  // Extract all folders from the file structure
  const extractFolders = (nodes: FileNode[], parentPath: string = ''): { path: string; name: string }[] => {
    const folders: { path: string; name: string }[] = [];
    
    nodes.forEach(node => {
      if (node.type === 'folder') {
        const folderPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        folders.push({ path: folderPath, name: node.name });
        
        // Recursively extract subfolders
        if (node.children) {
          folders.push(...extractFolders(node.children, folderPath));
        }
      }
    });
    
    return folders;
  };

  const folders = extractFolders(fileStructure);

  const handleFolderVisibilityChange = async (folderPath: string, isPublic: boolean) => {
    await updateFolderVisibility(folderPath, isPublic);
    onVisibilityChange?.();
  };

  if (folders.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No folders found in the file structure.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Folder Visibility</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Control which folders are visible in the public documentation. 
          Private folders and their contents will be hidden from public view.
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {folders.map(folder => (
            <FolderVisibilityControl
              key={folder.path}
              folderPath={folder.path}
              folderName={folder.name}
              isPublic={getFolderVisibility(folder.path)}
              onToggle={handleFolderVisibilityChange}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
