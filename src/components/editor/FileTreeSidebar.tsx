
import React from 'react';
import { FileNode } from '@/utils/fileSystem';
import { FileTreeItem } from './FileTreeItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ItemSettingsPanel } from './ItemSettingsPanel';
import { useSettingsPanel } from '@/hooks/useSettingsPanel';

interface FileTreeSidebarProps {
  title: string;
  description: string;
  selectedFile?: string;
  onFileSelect: (filePath: string) => void;
  fileStructure: FileNode[];
  pendingChanges?: string[];
  liveSessions?: Array<{ file_path: string; content: string }>;
}

export function FileTreeSidebar({
  title,
  description,
  selectedFile,
  onFileSelect,
  fileStructure,
  pendingChanges = [],
  liveSessions = []
}: FileTreeSidebarProps) {
  const { panelState, openPanel, closePanel } = useSettingsPanel();

  const handleOpenSettings = (itemPath: string, itemType: 'file' | 'folder', privacy: 'PUBLIC' | 'PRIVATE' = 'PUBLIC') => {
    // For now, we'll use a placeholder item ID since we don't have navigation items linked to file paths yet
    openPanel(`item-${itemPath}`, itemType, itemPath, privacy);
  };

  const handleSettingsUpdate = () => {
    // Refresh navigation or file structure if needed
    console.log('Settings updated for:', panelState.itemPath);
  };

  return (
    <>
      <div className="w-80 border-r border-border/50 bg-muted/20 flex flex-col h-full">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {fileStructure.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No files found</p>
              </div>
            ) : (
              fileStructure.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                  pendingChanges={pendingChanges}
                  liveSessions={liveSessions}
                  onOpenSettings={handleOpenSettings}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Settings Panel */}
      <ItemSettingsPanel
        isOpen={panelState.isOpen}
        onClose={closePanel}
        itemId={panelState.itemId}
        itemType={panelState.itemType}
        itemPath={panelState.itemPath}
        currentPrivacy={panelState.currentPrivacy}
        onSettingsUpdate={handleSettingsUpdate}
      />
    </>
  );
}
