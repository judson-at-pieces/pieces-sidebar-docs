
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, MoreHorizontal, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileNode } from '@/utils/fileSystem';

interface FileTreeItemProps {
  node: FileNode;
  selectedFile?: string;
  onFileSelect: (filePath: string) => void;
  level?: number;
  pendingChanges?: string[];
  liveSessions?: Array<{ file_path: string; content: string }>;
  onOpenSettings?: (itemPath: string, itemType: 'file' | 'folder', privacy?: 'PUBLIC' | 'PRIVATE') => void;
}

export function FileTreeItem({ 
  node, 
  selectedFile, 
  onFileSelect, 
  level = 0,
  pendingChanges = [],
  liveSessions = [],
  onOpenSettings
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isSelected = selectedFile === node.path;
  const hasChanges = pendingChanges.includes(node.path);
  const hasLiveSession = liveSessions.some(session => session.file_path === node.path && session.content.trim());
  
  const paddingLeft = level * 16 + (node.type === 'file' ? 24 : 8);

  const handleToggle = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenSettings) {
      onOpenSettings(node.path, node.type === 'folder' ? 'folder' : 'file', 'PUBLIC');
    }
  };

  const getFileIcon = () => {
    if (node.type === 'folder') {
      return isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getFileName = () => {
    if (node.type === 'file' && node.name.endsWith('.md')) {
      return node.name.replace(/\.md$/, '');
    }
    return node.name;
  };

  return (
    <div>
      <div
        className={`
          group flex items-center justify-between py-1 px-2 mx-1 rounded cursor-pointer hover:bg-muted/50 transition-colors
          ${isSelected ? 'bg-primary/10 text-primary border-l-2 border-primary' : ''}
        `}
        style={{ paddingLeft }}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {node.type === 'folder' && (
            <button className="p-0.5 hover:bg-muted rounded">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getFileIcon()}
            <span className="text-sm truncate font-medium">
              {getFileName()}
            </span>
            
            {hasChanges && (
              <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Has unsaved changes" />
            )}
            
            {hasLiveSession && (
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Live editing session" />
            )}
          </div>
        </div>

        {/* Settings Menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Globe className="h-4 w-4 mr-2" />
                Privacy Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Render children for folders */}
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              level={level + 1}
              pendingChanges={pendingChanges}
              liveSessions={liveSessions}
              onOpenSettings={onOpenSettings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
