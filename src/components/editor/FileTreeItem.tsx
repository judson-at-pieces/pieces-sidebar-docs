
import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { 
  GripVertical, 
  FileText, 
  FolderOpen, 
  Folder,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FileNode } from "@/utils/fileSystem";

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  index: number;
  isUsed: (path: string) => boolean;
}

export function FileTreeItem({ node, depth, index, isUsed }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const paddingLeft = depth * 16;

  // Check if any children are available
  const hasAvailableChildren = (node: FileNode): boolean => {
    if (!node.children) return false;
    
    // For folders with index files, check if there are other available children
    const indexFileName = `${node.name}.md`;
    return node.children.some(child => {
      if (child.type === 'file') {
        // Skip the index file itself, but include other files
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

    return (
      <Draggable draggableId={node.path} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-2 mb-1 border rounded-lg flex items-center gap-2 cursor-move transition-colors ${
              snapshot.isDragging ? 'bg-accent border-primary' : 'hover:bg-accent/50'
            }`}
            style={{ marginLeft: paddingLeft, ...provided.draggableProps.style }}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {node.name.replace('.md', '')}
            </span>
          </div>
        )}
      </Draggable>
    );
  }

  // For folders, check if they should be shown
  const showFolder = hasIndexFile(node) || hasAvailableChildren(node);
  if (!showFolder) return null;

  // Count available items (including the folder itself if it has an index file)
  const availableCount = (hasIndexFile(node) ? 1 : 0) + 
    (node.children?.filter(child => 
      child.type === 'file' ? (!isUsed(child.path) && child.name !== `${node.name}.md`) : hasAvailableChildren(child)
    ).length || 0);

  return (
    <div style={{ marginLeft: paddingLeft }}>
      <Draggable draggableId={`folder-${node.path}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-2 ${snapshot.isDragging ? 'opacity-75' : ''}`}
          >
            <div 
              {...provided.dragHandleProps}
              className={`p-2 flex items-center gap-2 cursor-move hover:bg-accent/30 rounded transition-colors ${
                snapshot.isDragging ? 'bg-accent border border-primary' : ''
              }`}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {hasAvailableChildren(node) ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                )
              ) : (
                <div className="h-4 w-4 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Folder className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{node.name}</span>
              <Badge variant="secondary" className="text-xs">
                {availableCount}
              </Badge>
              {hasIndexFile(node) && (
                <Badge variant="outline" className="text-xs">
                  Index
                </Badge>
              )}
            </div>
            {isExpanded && hasAvailableChildren(node) && node.children && (
              <div className="mt-1">
                {node.children
                  .filter(child => {
                    if (child.type === 'file') {
                      // Exclude the index file and used files
                      return child.name !== `${node.name}.md` && !isUsed(child.path);
                    }
                    return hasAvailableChildren(child);
                  })
                  .map((child, childIndex) => (
                    <FileTreeItem 
                      key={child.path} 
                      node={child} 
                      depth={depth + 1} 
                      index={childIndex}
                      isUsed={isUsed}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </Draggable>
    </div>
  );
}
