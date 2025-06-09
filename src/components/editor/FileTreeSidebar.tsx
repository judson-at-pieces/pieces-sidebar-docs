import React, { useState } from 'react';
import { FileNode } from '@/hooks/useFileStructure';
import { FileText, Folder, ChevronDown, ChevronRight } from 'lucide-react';

interface LiveSession {
  file_path: string;
  locked_by_email?: string;
  locked_by_name?: string;
  locked_at?: string;
}

interface FileTreeSidebarProps {
  title: string;
  description: string;
  selectedFile?: string;
  onFileSelect: (filePath: string) => void;
  fileStructure: FileNode[];
  pendingChanges?: string[];
  liveSessions?: LiveSession[];
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
  const [expandedDirs, setExpandedDirs] = useState(new Set<string>());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleDirectory = (dirPath: string) => {
    const newExpandedDirs = new Set(expandedDirs);
    if (newExpandedDirs.has(dirPath)) {
      newExpandedDirs.delete(dirPath);
    } else {
      newExpandedDirs.add(dirPath);
    }
    setExpandedDirs(newExpandedDirs);
  };

  const isLiveEditing = (filePath: string) => {
    return liveSessions.some(session => session.file_path === filePath);
  };

  const getLiveEditingUser = (filePath: string) => {
    const session = liveSessions.find(session => session.file_path === filePath);
    return session?.locked_by_name || session?.locked_by_email || 'Someone';
  };

  const renderFileNode = (node: FileNode, level: number = 0) => {
    const isSelected = selectedFile === node.path;
    const hasPendingChanges = pendingChanges.includes(node.path);
    const isBeingEdited = isLiveEditing(node.path);
    const editingUser = isBeingEdited ? getLiveEditingUser(node.path) : null;
    
    // Filter out nodes that don't match the search term
    if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    if (node.type === 'directory') {
      const isExpanded = expandedDirs.has(node.path);
      
      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 group ${
              level > 0 ? 'ml-4' : ''
            } hover:bg-muted/50`}
            onClick={() => toggleDirectory(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Folder className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{node.name}</span>
            {node.children && (
              <span className="text-xs text-muted-foreground ml-auto">
                {node.children.length}
              </span>
            )}
          </div>
          
          {isExpanded && node.children && (
            <div className="ml-2 border-l border-border/30 pl-2">
              {node.children.map((child) => renderFileNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 group ${
          level > 0 ? 'ml-4' : ''
        } ${
          isSelected
            ? 'bg-primary/10 border border-primary/20 shadow-sm'
            : 'hover:bg-muted/50'
        }`}
        onClick={() => onFileSelect(node.path)}
      >
        <FileText className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className={`text-sm flex-1 truncate ${isSelected ? 'font-medium' : ''}`}>
          {node.name}
        </span>
        
        <div className="flex items-center gap-1">
          {hasPendingChanges && (
            <div className="w-2 h-2 rounded-full bg-amber-500" title="Has pending changes" />
          )}
          {isBeingEdited && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title={`Being edited by ${editingUser}`} />
              <span className="text-xs text-muted-foreground hidden group-hover:inline">
                {editingUser}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-border/50 flex flex-col bg-background">
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      
      {/* Search Bar */}
      <div className="p-3">
        <input
          type="search"
          placeholder="Search files..."
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* File Structure */}
      <div className="flex-1 overflow-y-auto p-2">
        {fileStructure.map((node) => renderFileNode(node))}
      </div>
    </div>
  );
}
