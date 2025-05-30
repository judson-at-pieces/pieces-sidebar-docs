
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
    return node.children.some(child => {
      if (child.type === 'file') return !isUsed(child.path);
      return hasAvailableChildren(child);
    });
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

  if (!hasAvailableChildren(node)) return null;

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
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Folder className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{node.name}</span>
              <Badge variant="secondary" className="text-xs">
                {node.children?.filter(child => 
                  child.type === 'file' ? !isUsed(child.path) : hasAvailableChildren(child)
                ).length || 0}
              </Badge>
            </div>
            {isExpanded && node.children && (
              <div className="mt-1">
                {node.children.map((child, childIndex) => (
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
