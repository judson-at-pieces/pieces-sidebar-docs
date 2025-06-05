
import { useState } from "react";
import { FileText, Folder, FolderOpen, Plus, ChevronDown, ChevronRight, Check, Save, RotateCcw, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileNode } from "@/utils/fileSystem";
import { NavigationSection, NavigationItem } from "@/services/navigationService";
import { BulkMoveDialog } from "./BulkMoveDialog";
import { usePendingAdditions } from "./hooks/usePendingAdditions";

interface PendingChange {
  type: 'folder' | 'file';
  sectionId: string;
  folderNode?: FileNode;
  fileNode?: FileNode;
  previewItems: NavigationItem[];
}

interface AvailableFilesPanelProps {
  fileStructure: FileNode[];
  isFileUsed: (path: string) => boolean;
  sections: NavigationSection[];
  onAddToSection: (change: PendingChange) => void;
  onShowPreview: (show: boolean) => void;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  isUsed: (path: string) => boolean;
  sections: NavigationSection[];
  onAddToSection: (change: PendingChange) => void;
  onShowPreview: (show: boolean) => void;
  onTogglePendingAddition: (node: FileNode) => void;
  isPendingAddition: (path: string) => boolean;
}

function FileTreeItem({ 
  node, 
  depth, 
  isUsed, 
  sections, 
  onAddToSection, 
  onShowPreview,
  onTogglePendingAddition,
  isPendingAddition
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const paddingLeft = depth * 16;

  // Recursively count all files in a folder and its subfolders
  const countAllFilesInFolder = (folderNode: FileNode): number => {
    if (!folderNode.children) return 0;
    
    let count = 0;
    for (const child of folderNode.children) {
      if (child.type === 'file') {
        count++;
      } else if (child.type === 'folder') {
        count += countAllFilesInFolder(child);
      }
    }
    return count;
  };

  // Recursively count available files in a folder and its subfolders
  const countAvailableFilesInFolder = (folderNode: FileNode): number => {
    if (!folderNode.children) return 0;
    
    const indexFileName = `${folderNode.name}.md`;
    let count = 0;
    
    for (const child of folderNode.children) {
      if (child.type === 'file') {
        // Don't count index files or used files
        if (child.name !== indexFileName && !isUsed(child.path)) {
          count++;
        }
      } else if (child.type === 'folder') {
        count += countAvailableFilesInFolder(child);
      }
    }
    return count;
  };

  // Create navigation items from folder structure with proper hierarchy
  const createNavigationItemsFromFolder = (folderNode: FileNode, parentId?: string): NavigationItem[] => {
    const indexFileName = `${folderNode.name}.md`;
    const indexFile = folderNode.children?.find(child => 
      child.type === 'file' && child.name === indexFileName
    );
    
    const folderId = `temp-${Date.now()}-${Math.random()}`;
    const folderItem: NavigationItem = {
      id: folderId,
      title: folderNode.name.replace(/-/g, ' '),
      href: indexFile ? `/${indexFile.path.replace('.md', '')}` : `/${folderNode.path}`,
      file_path: indexFile?.path || folderNode.path,
      order_index: 0,
      parent_id: parentId,
      is_auto_generated: true,
      items: []
    };

    if (folderNode.children) {
      let childOrder = 0;
      
      // Add files first (except index file)
      for (const child of folderNode.children) {
        if (child.type === 'file' && child.name !== indexFileName) {
          const childItem: NavigationItem = {
            id: `temp-${Date.now()}-${Math.random()}`,
            title: child.name.replace('.md', '').replace(/-/g, ' '),
            href: `/${child.path.replace('.md', '')}`,
            file_path: child.path,
            order_index: childOrder++,
            parent_id: folderId,
            is_auto_generated: true
          };
          
          folderItem.items!.push(childItem);
        }
      }
      
      // Add subfolders recursively
      for (const child of folderNode.children) {
        if (child.type === 'folder') {
          const subFolderItems = createNavigationItemsFromFolder(child, folderId);
          if (subFolderItems.length > 0) {
            const subFolder = subFolderItems[0];
            subFolder.order_index = childOrder++;
            subFolder.parent_id = folderId;
            folderItem.items!.push(subFolder);
          }
        }
      }
    }
    
    return [folderItem];
  };

  const handleAddItem = () => {
    if (!selectedSection) return;

    if (node.type === 'folder') {
      const previewItems = createNavigationItemsFromFolder(node);
      onAddToSection({
        type: 'folder',
        sectionId: selectedSection,
        folderNode: node,
        previewItems
      });
    } else {
      const previewItem: NavigationItem = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title: node.name.replace('.md', '').replace(/-/g, ' '),
        href: `/${node.path.replace('.md', '')}`,
        file_path: node.path,
        order_index: 0,
        parent_id: undefined,
        is_auto_generated: true
      };
      
      onAddToSection({
        type: 'file',
        sectionId: selectedSection,
        fileNode: node,
        previewItems: [previewItem]
      });
    }
    
    onShowPreview(true);
    setSelectedSection("");
  };

  // Check if any children are available
  const hasAvailableChildren = (node: FileNode): boolean => {
    if (!node.children) return false;
    
    const indexFileName = `${node.name}.md`;
    return node.children.some(child => {
      if (child.type === 'file') {
        return child.name !== indexFileName && !isUsed(child.path);
      }
      return hasAvailableChildren(child);
    });
  };

  // Check if this folder has an index file
  const hasIndexFile = (node: FileNode): boolean => {
    if (!node.children) return false;
    const indexFileName = `${node.name}.md`;
    return node.children.some(child => 
      child.type === 'file' && child.name === indexFileName
    );
  };

  if (node.type === 'file') {
    const used = isUsed(node.path);
    if (used) return null;

    const isSelected = isPendingAddition(node.path);

    return (
      <div
        className={`p-3 mb-2 border rounded-lg flex items-center gap-3 transition-all group ${
          isSelected 
            ? 'border-primary bg-primary/10' 
            : 'hover:bg-accent/50 hover:border-primary/20'
        }`}
        style={{ marginLeft: paddingLeft }}
      >
        <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">
            {node.name.replace('.md', '')}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant={isSelected ? "default" : "ghost"}
            onClick={() => onTogglePendingAddition(node)}
            className={`h-6 w-6 p-0 transition-all ${
              isSelected 
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                : 'opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {isSelected ? (
              <Check className="h-3 w-3" />
            ) : (
              <div className="h-3 w-3 border border-current rounded-sm" />
            )}
          </Button>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-32 h-8 text-xs bg-background border-border">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-popover border-border shadow-lg" position="popper" sideOffset={4}>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id} className="text-xs">
                  {section.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            disabled={!selectedSection}
            className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // For folders, check if they should be shown
  const showFolder = hasIndexFile(node) || hasAvailableChildren(node);
  if (!showFolder) return null;

  const isSelected = isPendingAddition(node.path);

  // Count all files and available files including subfolders
  const totalFilesInFolder = countAllFilesInFolder(node);
  const availableFilesInFolder = countAvailableFilesInFolder(node);
  const usedFilesInFolder = totalFilesInFolder - availableFilesInFolder;

  // Count direct children for immediate visibility
  const directAvailableChildren = node.children?.filter(child => {
    if (child.type === 'file') {
      return child.name !== `${node.name}.md` && !isUsed(child.path);
    }
    return hasAvailableChildren(child);
  }).length || 0;

  const canExpand = hasAvailableChildren(node);

  return (
    <div style={{ marginLeft: paddingLeft }} className="mb-2">
      <div className={`p-3 border rounded-lg transition-all group ${
        isSelected ? 'border-primary bg-primary/10' : 'hover:bg-accent/30'
      }`}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              if (canExpand) {
                setIsExpanded(!isExpanded);
              }
            }}
            disabled={!canExpand}
          >
            {canExpand ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-600" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0 text-blue-600" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{node.name}</span>
            <div className="flex items-center gap-2 mt-1">
              {availableFilesInFolder > 0 && (
                <Badge variant="outline" className="text-xs">
                  {availableFilesInFolder} available
                </Badge>
              )}
              {totalFilesInFolder > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalFilesInFolder} total
                </Badge>
              )}
              {usedFilesInFolder > 0 && (
                <Badge variant="default" className="text-xs bg-muted text-muted-foreground">
                  {usedFilesInFolder} used
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant={isSelected ? "default" : "ghost"}
              onClick={() => onTogglePendingAddition(node)}
              className={`h-6 w-6 p-0 transition-all ${
                isSelected 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                  : 'opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {isSelected ? (
                <Check className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 border border-current rounded-sm" />
              )}
            </Button>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-32 h-8 text-xs bg-background border-border">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-popover border-border shadow-lg" position="popper" sideOffset={4}>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id} className="text-xs">
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              disabled={!selectedSection}
              className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {isExpanded && canExpand && node.children && (
          <div className="mt-2 space-y-1">
            {node.children
              .filter(child => {
                if (child.type === 'file') {
                  return child.name !== `${node.name}.md` && !isUsed(child.path);
                }
                return hasAvailableChildren(child);
              })
              .map((child) => (
                <FileTreeItem 
                  key={child.path} 
                  node={child} 
                  depth={depth + 1} 
                  isUsed={isUsed}
                  sections={sections}
                  onAddToSection={onAddToSection}
                  onShowPreview={onShowPreview}
                  onTogglePendingAddition={onTogglePendingAddition}
                  isPendingAddition={isPendingAddition}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AvailableFilesPanel({ fileStructure, isFileUsed, sections, onAddToSection, onShowPreview }: AvailableFilesPanelProps) {
  const {
    pendingAdditions,
    addPendingAddition,
    removePendingAddition,
    clearPendingAdditions,
    isPendingAddition
  } = usePendingAdditions();

  const [showBulkMoveDialog, setShowBulkMoveDialog] = useState(false);
  const [bulkSelectedSection, setBulkSelectedSection] = useState("");

  const handleTogglePendingAddition = (node: FileNode) => {
    if (isPendingAddition(node.path)) {
      removePendingAddition(node.path);
    } else {
      addPendingAddition(node);
    }
  };

  const handleBulkMove = () => {
    if (pendingAdditions.length === 0) return;
    setShowBulkMoveDialog(true);
  };

  const handleConfirmBulkMove = () => {
    if (!bulkSelectedSection || pendingAdditions.length === 0) return;

    console.log('Processing bulk move for', pendingAdditions.length, 'items to section', bulkSelectedSection);

    // Process each pending addition individually
    pendingAdditions.forEach((addition, index) => {
      console.log(`Processing item ${index + 1}:`, addition.node.name, 'type:', addition.type);
      
      if (addition.type === 'folder') {
        const previewItems = createNavigationItemsFromFolder(addition.node);
        console.log('Created folder preview items:', previewItems);
        onAddToSection({
          type: 'folder',
          sectionId: bulkSelectedSection,
          folderNode: addition.node,
          previewItems
        });
      } else {
        const previewItem: NavigationItem = {
          id: `temp-${Date.now()}-${Math.random()}-${index}`,
          title: addition.node.name.replace('.md', '').replace(/-/g, ' '),
          href: `/${addition.node.path.replace('.md', '')}`,
          file_path: addition.node.path,
          order_index: 0,
          parent_id: undefined,
          is_auto_generated: true
        };
        
        console.log('Created file preview item:', previewItem);
        onAddToSection({
          type: 'file',
          sectionId: bulkSelectedSection,
          fileNode: addition.node,
          previewItems: [previewItem]
        });
      }
    });

    console.log('Bulk move completed, showing preview');
    
    // Show preview for the bulk operation
    onShowPreview(true);
    
    // Clear selections and close dialog
    clearPendingAdditions();
    setShowBulkMoveDialog(false);
    setBulkSelectedSection("");
  };

  // Helper function used in bulk operations
  const createNavigationItemsFromFolder = (folderNode: FileNode, parentId?: string): NavigationItem[] => {
    const indexFileName = `${folderNode.name}.md`;
    const indexFile = folderNode.children?.find(child => 
      child.type === 'file' && child.name === indexFileName
    );
    
    const folderId = `temp-${Date.now()}-${Math.random()}`;
    const folderItem: NavigationItem = {
      id: folderId,
      title: folderNode.name.replace(/-/g, ' '),
      href: indexFile ? `/${indexFile.path.replace('.md', '')}` : `/${folderNode.path}`,
      file_path: indexFile?.path || folderNode.path,
      order_index: 0,
      parent_id: parentId,
      is_auto_generated: true,
      items: []
    };

    if (folderNode.children) {
      let childOrder = 0;
      
      // Add files first (except index file)
      for (const child of folderNode.children) {
        if (child.type === 'file' && child.name !== indexFileName) {
          const childItem: NavigationItem = {
            id: `temp-${Date.now()}-${Math.random()}`,
            title: child.name.replace('.md', '').replace(/-/g, ' '),
            href: `/${child.path.replace('.md', '')}`,
            file_path: child.path,
            order_index: childOrder++,
            parent_id: folderId,
            is_auto_generated: true
          };
          
          folderItem.items!.push(childItem);
        }
      }
      
      // Add subfolders recursively
      for (const child of folderNode.children) {
        if (child.type === 'folder') {
          const subFolderItems = createNavigationItemsFromFolder(child, folderId);
          if (subFolderItems.length > 0) {
            const subFolder = subFolderItems[0];
            subFolder.order_index = childOrder++;
            subFolder.parent_id = folderId;
            folderItem.items!.push(subFolder);
          }
        }
      }
    }
    
    return [folderItem];
  };

  // Count all files recursively
  const countAllFiles = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'file') {
        return count + 1;
      } else if (node.children) {
        return count + countAllFiles(node.children);
      }
      return count;
    }, 0);
  };

  // Count available files recursively
  const countAvailableFiles = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'file') {
        return count + (isFileUsed(node.path) ? 0 : 1);
      } else if (node.children) {
        return count + countAvailableFiles(node.children);
      }
      return count;
    }, 0);
  };

  const totalFiles = countAllFiles(fileStructure);
  const availableFiles = countAvailableFiles(fileStructure);
  const usedFiles = totalFiles - availableFiles;

  // Filter to show only available files/folders
  const availableFileNodes = fileStructure.filter(node => {
    const hasAvailableChildren = (node: FileNode): boolean => {
      if (!node.children) return false;
      
      const indexFileName = `${node.name}.md`;
      return node.children.some(child => {
        if (child.type === 'file') {
          return child.name !== indexFileName && !isFileUsed(child.path);
        }
        return hasAvailableChildren(child);
      });
    };

    if (node.type === 'file') {
      return !isFileUsed(node.path);
    }
    return hasAvailableChildren(node);
  });

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/50">
      <CardHeader className="pb-4 flex-shrink-0 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Files
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline" className="text-xs">
                {availableFiles} available
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {totalFiles} total
              </Badge>
              {usedFiles > 0 && (
                <Badge variant="default" className="text-xs bg-muted text-muted-foreground">
                  {usedFiles} used
                </Badge>
              )}
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingAdditions.length > 0 && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={clearPendingAdditions}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={handleBulkMove}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Move {pendingAdditions.length}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {usedFiles} files already in navigation • {availableFiles} files available to add
          {pendingAdditions.length > 0 && (
            <span className="text-primary font-medium">
              {' • '}{pendingAdditions.length} item{pendingAdditions.length !== 1 ? 's' : ''} selected for addition
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full w-full">
          <div className="p-4">
            {availableFileNodes.length > 0 ? (
              <div className="space-y-2">
                {availableFileNodes.map((node) => (
                  <FileTreeItem 
                    key={node.path} 
                    node={node} 
                    depth={0} 
                    isUsed={isFileUsed}
                    sections={sections}
                    onAddToSection={onAddToSection}
                    onShowPreview={onShowPreview}
                    onTogglePendingAddition={handleTogglePendingAddition}
                    isPendingAddition={isPendingAddition}
                  />
                ))}
              </div>
            ) : totalFiles === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No files found</p>
                <p className="text-sm">No markdown files could be loaded from the repository</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">All files are in use</p>
                <p className="text-sm">All {totalFiles} files have been added to navigation sections</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <BulkMoveDialog
        open={showBulkMoveDialog}
        onOpenChange={setShowBulkMoveDialog}
        pendingAdditions={pendingAdditions}
        sections={sections}
        selectedSection={bulkSelectedSection}
        onSectionChange={setBulkSelectedSection}
        onConfirm={handleConfirmBulkMove}
        onCancel={() => setShowBulkMoveDialog(false)}
      />
    </Card>
  );
}
