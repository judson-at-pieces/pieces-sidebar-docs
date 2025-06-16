
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileNode } from '@/hooks/useFileStructure';
import { FolderContextMenu, FolderDropdownMenu } from './FolderContextMenu';

interface FileTreeItemProps {
  node: FileNode;
  selectedFile?: string;
  onFileSelect: (filePath: string) => void;
  pendingChanges?: string[];
  liveSessions?: any[];
  onFolderVisibilityChange?: () => void;
}

export function FileTreeItem({ 
  node, 
  selectedFile, 
  onFileSelect, 
  pendingChanges = [], 
  liveSessions = [],
  onFolderVisibilityChange
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const isFile = node.type === 'file';
  const isSelected = selectedFile === node.path;
  const hasPendingChanges = pendingChanges.includes(node.path);
  const hasLiveSession = liveSessions.some(session => session.file_path === node.path);

  const handleClick = () => {
    if (isFile) {
      onFileSelect(node.path);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const renderFileItem = () => (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors group ${
        isSelected 
          ? 'bg-accent text-accent-foreground' 
          : 'hover:bg-muted/50'
      }`}
      onClick={handleClick}
    >
      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
      <span className="truncate flex-1">{node.name}</span>
      
      {hasPendingChanges && (
        <Badge variant="secondary" className="h-4 text-xs px-1">
          •
        </Badge>
      )}
      
      {hasLiveSession && (
        <Badge variant="outline" className="h-4 text-xs px-1">
          Live
        </Badge>
      )}
    </div>
  );

  const renderFolderItem = () => {
    const folderContent = (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors group hover:bg-muted/50`}
        onClick={handleClick}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-4 w-4 p-0 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
        
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
        )}
        
        <span className="truncate flex-1">{node.name}</span>
        
        <FolderDropdownMenu
          folderPath={node.path}
          folderName={node.name}
          onVisibilityChange={onFolderVisibilityChange}
        />
      </div>
    );

    return (
      <FolderContextMenu
        folderPath={node.path}
        folderName={node.name}
        onVisibilityChange={onFolderVisibilityChange}
      >
        {folderContent}
      </FolderContextMenu>
    );
  };

  return (
    <div>
      {isFile ? renderFileItem() : renderFolderItem()}
      
      {!isFile && isExpanded && node.children && (
        <div className="ml-4 space-y-1">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              pendingChanges={pendingChanges}
              liveSessions={liveSessions}
              onFolderVisibilityChange={onFolderVisibilityChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
