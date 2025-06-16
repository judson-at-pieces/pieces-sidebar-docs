
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileNode } from '@/hooks/useFileStructure';
import { FileTreeItem } from './FileTreeItem';

interface FileTreeSidebarProps {
  title: string;
  description?: string;
  selectedFile?: string;
  onFileSelect: (filePath: string) => void;
  fileStructure: FileNode[];
  pendingChanges?: string[];
  liveSessions?: any[];
  onFolderVisibilityChange?: () => void;
}

export function FileTreeSidebar({
  title,
  description,
  selectedFile,
  onFileSelect,
  fileStructure,
  pendingChanges = [],
  liveSessions = [],
  onFolderVisibilityChange
}: FileTreeSidebarProps) {
  return (
    <div className="w-80 border-r border-border/50 bg-muted/20 flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {fileStructure.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              pendingChanges={pendingChanges}
              liveSessions={liveSessions}
              onFolderVisibilityChange={onFolderVisibilityChange}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
