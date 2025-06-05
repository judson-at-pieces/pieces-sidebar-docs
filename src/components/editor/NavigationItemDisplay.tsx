
import { useState } from "react";
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight,
  GripVertical,
  Check,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavigationItem } from "@/services/navigationService";
import { PendingDeletion } from "./hooks/usePendingDeletions";
import { Draggable } from "@hello-pangea/dnd";

interface NavigationItemDisplayProps {
  item: NavigationItem;
  index: number;
  sectionId: string;
  pendingDeletions: PendingDeletion[];
  onTogglePendingDeletion: (sectionId: string, itemIndex: number) => void;
  depth?: number;
  globalIndex: number;
}

export function NavigationItemDisplay({ 
  item, 
  index, 
  sectionId, 
  pendingDeletions, 
  onTogglePendingDeletion, 
  depth = 0,
  globalIndex
}: NavigationItemDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const paddingLeft = depth * 16;
  
  const hasChildren = item.items && item.items.length > 0;
  
  // Find if this item is pending deletion using global index
  const isPendingDeletion = pendingDeletions.some(
    deletion => deletion.sectionId === sectionId && deletion.itemIndex === globalIndex
  );

  return (
    <Draggable draggableId={`${sectionId}-${item.id}`} index={globalIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`transition-all ${snapshot.isDragging ? 'opacity-75' : ''}`}
        >
          <div 
            className={`p-2 mb-1 border rounded-lg flex items-center gap-2 transition-all group ${
              isPendingDeletion 
                ? 'border-destructive bg-destructive/10' 
                : snapshot.isDragging 
                  ? 'bg-accent border-primary' 
                  : 'hover:bg-accent/50'
            }`}
            style={{ marginLeft: paddingLeft }}
          >
            <div {...provided.dragHandleProps} className="cursor-grab hover:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/10"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="h-6 w-6 flex items-center justify-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            
            {hasChildren && (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 flex-shrink-0 text-blue-600" />
              )
            )}
            
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">
                {item.title}
              </span>
              {hasChildren && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {item.items!.length} items
                </Badge>
              )}
            </div>
            
            <Button
              size="sm"
              variant={isPendingDeletion ? "destructive" : "ghost"}
              onClick={() => onTogglePendingDeletion(sectionId, globalIndex)}
              className={`h-6 w-6 p-0 transition-all ${
                isPendingDeletion 
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                  : 'opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground'
              }`}
            >
              {isPendingDeletion ? (
                <Check className="h-3 w-3" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {item.items!.map((childItem, childIndex) => {
                const childGlobalIndex = globalIndex + childIndex + 1; // Simple increment for nested items
                return (
                  <NavigationItemDisplay
                    key={childItem.id}
                    item={childItem}
                    index={childIndex}
                    sectionId={sectionId}
                    pendingDeletions={pendingDeletions}
                    onTogglePendingDeletion={onTogglePendingDeletion}
                    depth={depth + 1}
                    globalIndex={childGlobalIndex}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
