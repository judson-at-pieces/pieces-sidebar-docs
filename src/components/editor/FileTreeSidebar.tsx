
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Folder, FolderOpen, ChevronDown, ChevronRight, Search } from "lucide-react";
import { FileNode } from "@/utils/fileSystem";

interface FileTreeItemProps {
  node: FileNode;
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  depth?: number;
  pendingChanges: string[];
  searchTerm?: string;
}

function FileTreeItem({ 
  node, 
  selectedFile, 
  onFileSelect, 
  depth = 0,
  pendingChanges,
  searchTerm = ""
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isFile = node.type === 'file';
  const isSelected = selectedFile === node.path;
  const hasChanges = pendingChanges.includes(node.path);

  // Check if this node or any of its children match the search term
  const matchesSearch = (node: FileNode, term: string): boolean => {
    if (!term) return true;
    
    const lowerTerm = term.toLowerCase();
    const nameMatch = node.name.toLowerCase().includes(lowerTerm);
    const pathMatch = node.path.toLowerCase().includes(lowerTerm);
    
    if (nameMatch || pathMatch) return true;
    
    // Check children
    if (node.children) {
      return node.children.some(child => matchesSearch(child, term));
    }
    
    return false;
  };

  const shouldShow = matchesSearch(node, searchTerm);
  
  if (!shouldShow) return null;

  const handleClick = () => {
    if (isFile && onFileSelect) {
      onFileSelect(node.path);
    } else if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  // Highlight search term in the name
  const highlightedName = searchTerm ? 
    node.name.replace(
      new RegExp(`(${searchTerm})`, 'gi'),
      '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
    ) : node.name;

  return (
    <div>
      <div 
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded-sm ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {!hasChildren && <div className="w-4" />}
        
        {isFile ? (
          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
        ) : hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
          )
        ) : null}
        
        <span 
          className="text-sm truncate flex-1"
          dangerouslySetInnerHTML={{ __html: highlightedName }}
        />
        
        {hasChanges && (
          <div className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              depth={depth + 1}
              pendingChanges={pendingChanges}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileTreeSidebarProps {
  title: string;
  description: string;
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  fileStructure?: FileNode[];
  pendingChanges?: string[];
  actionButton?: React.ReactNode;
}

export function FileTreeSidebar({ 
  title, 
  description, 
  selectedFile, 
  onFileSelect, 
  fileStructure, 
  pendingChanges = [],
  actionButton 
}: FileTreeSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-80 border-r border-border/50 bg-muted/20 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          {actionButton}
        </div>
        
        {/* Search Input */}
        <div className="mt-3 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        {pendingChanges.length > 0 && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            {pendingChanges.length} file(s) with unsaved changes
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-2">
            {fileStructure?.map((node) => (
              <FileTreeItem
                key={node.path}
                node={node}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                pendingChanges={pendingChanges}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
