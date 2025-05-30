
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, FolderOpen, Folder, Plus, Circle, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileNode } from "@/utils/fileSystem";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileTreeProps {
  items: FileNode[];
  depth?: number;
  selectedFile?: string;
  onFileSelect?: (file: string) => void;
  modifiedFiles?: Set<string>;
  searchTerm?: string;
  onCreateFile?: (fileName: string, parentPath?: string) => void;
}

function FileTree({ items, depth = 0, selectedFile, onFileSelect, modifiedFiles, searchTerm, onCreateFile }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderPath)
        ? prev.filter(path => path !== folderPath)
        : [...prev, folderPath]
    );
  };

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    
    if (item.type === 'file') {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.path.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      const folderMatches = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasMatchingChild = item.children?.some(child => 
        child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (child.type === 'folder' && hasNestedMatch(child, searchTerm))
      );
      return folderMatches || hasMatchingChild;
    }
  });

  const hasNestedMatch = (folder: FileNode, term: string): boolean => {
    if (!folder.children) return false;
    return folder.children.some(child => 
      child.name.toLowerCase().includes(term.toLowerCase()) ||
      (child.type === 'folder' && hasNestedMatch(child, term))
    );
  };

  const paddingClass = depth === 0 ? "pl-3" : depth === 1 ? "pl-6" : "pl-9";

  return (
    <div className="space-y-1">
      {filteredItems.map((item) => {
        const isExpanded = expandedFolders.includes(item.path);
        
        return (
          <div key={item.path}>
            {item.type === "folder" ? (
              <div>
                <div className="flex items-center group">
                  <Collapsible 
                    open={isExpanded} 
                    onOpenChange={() => toggleFolder(item.path)}
                    className="flex-1"
                  >
                    <div className="flex items-center">
                      <div className={cn(
                        "flex-1 flex items-center py-2 text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
                        paddingClass
                      )}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="h-auto p-1 mr-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        {isExpanded ? (
                          <FolderOpen className="h-4 w-4 mr-2" />
                        ) : (
                          <Folder className="h-4 w-4 mr-2" />
                        )}
                        <span className="break-words whitespace-normal leading-tight font-semibold text-foreground text-left">
                          {item.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onCreateFile?.('', item.path)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <CollapsibleContent className="space-y-1 ml-2">
                      {item.children && (
                        <FileTree
                          items={item.children}
                          depth={depth + 1}
                          selectedFile={selectedFile}
                          onFileSelect={onFileSelect}
                          modifiedFiles={modifiedFiles}
                          searchTerm={searchTerm}
                          onCreateFile={onCreateFile}
                        />
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 min-h-[32px] rounded-lg transition-colors break-words whitespace-normal leading-tight",
                  paddingClass,
                  selectedFile === item.path && "bg-accent"
                )}
                onClick={() => onFileSelect?.(item.path)}
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate flex-1 text-left">{item.name}</span>
                {modifiedFiles?.has(item.path) && (
                  <Circle className="h-2 w-2 fill-orange-500 text-orange-500 flex-shrink-0" />
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface EditorSidebarProps {
  selectedFile?: string;
  onFileSelect: (file: string) => void;
  modifiedFiles?: Set<string>;
  onCreateFile?: (fileName: string, parentPath?: string) => void;
  fileStructure: FileNode[];
  isLoading: boolean;
}

export function EditorSidebar({ selectedFile, onFileSelect, modifiedFiles, onCreateFile, fileStructure, isLoading }: EditorSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileParent, setNewFileParent] = useState<string>();

  const handleCreateFile = (fileName: string = '', parentPath?: string) => {
    setNewFileParent(parentPath);
    setShowNewFileInput(true);
    setNewFileName(fileName);
  };

  const handleConfirmNewFile = () => {
    if (newFileName.trim()) {
      onCreateFile?.(newFileName, newFileParent);
      setShowNewFileInput(false);
      setNewFileName("");
      setNewFileParent(undefined);
    }
  };

  const handleCancelNewFile = () => {
    setShowNewFileInput(false);
    setNewFileName("");
    setNewFileParent(undefined);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          {searchTerm && (
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSearchTerm("")}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* New file input or button */}
        {showNewFileInput ? (
          <div className="space-y-2">
            <Input
              placeholder="Enter file name..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmNewFile();
                if (e.key === 'Escape') handleCancelNewFile();
              }}
              autoFocus
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleConfirmNewFile} disabled={!newFileName.trim()}>
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelNewFile}>
                Cancel
              </Button>
            </div>
            {newFileParent && (
              <div className="text-xs text-muted-foreground">
                Creating in: {newFileParent}
              </div>
            )}
          </div>
        ) : (
          <Button className="w-full" size="sm" onClick={() => handleCreateFile()}>
            <Plus className="h-4 w-4 mr-2" />
            New File
          </Button>
        )}
      </div>

      {/* File tree */}
      <ScrollArea className="flex-1">
        <div className="px-2">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading files...</div>
          ) : (
            <FileTree
              items={fileStructure}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              modifiedFiles={modifiedFiles}
              searchTerm={searchTerm}
              onCreateFile={handleCreateFile}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
