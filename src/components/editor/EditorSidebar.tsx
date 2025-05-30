
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, FolderOpen, Folder, Plus, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileNode, loadContentStructure } from "@/utils/fileSystem";

interface FileTreeProps {
  items: FileNode[];
  depth?: number;
  selectedFile?: string;
  onFileSelect?: (file: string) => void;
  modifiedFiles?: Set<string>;
  searchTerm?: string;
}

function FileTree({ items, depth = 0, selectedFile, onFileSelect, modifiedFiles, searchTerm }: FileTreeProps) {
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
      // For folders, show if any child matches or folder name matches
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
        return (
          <div key={item.path}>
            {item.type === "folder" ? (
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-8",
                    paddingClass
                  )}
                  onClick={() => toggleFolder(item.path)}
                >
                  {expandedFolders.includes(item.path) ? (
                    <FolderOpen className="h-4 w-4 mr-2" />
                  ) : (
                    <Folder className="h-4 w-4 mr-2" />
                  )}
                  <span className="truncate">{item.name}</span>
                </Button>
                {(expandedFolders.includes(item.path) || searchTerm) && item.children && (
                  <FileTree
                    items={item.children}
                    depth={depth + 1}
                    selectedFile={selectedFile}
                    onFileSelect={onFileSelect}
                    modifiedFiles={modifiedFiles}
                    searchTerm={searchTerm}
                  />
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-8",
                  paddingClass,
                  selectedFile === item.path && "bg-accent"
                )}
                onClick={() => onFileSelect?.(item.path)}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="truncate flex-1">{item.name}</span>
                {modifiedFiles?.has(item.path) && (
                  <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
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
}

export function EditorSidebar({ selectedFile, onFileSelect, modifiedFiles }: EditorSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      try {
        const structure = await loadContentStructure();
        setFileStructure(structure);
      } catch (error) {
        console.error('Failed to load file structure:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* New file button */}
        <Button className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New File
        </Button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading files...</div>
        ) : (
          <FileTree
            items={fileStructure}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            modifiedFiles={modifiedFiles}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </div>
  );
}
