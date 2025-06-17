
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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

interface NavigationItemListProps {
  sectionId: string;
  items: NavigationItem[];
  pendingDeletions: PendingDeletion[];
  onTogglePendingDeletion: (sectionId: string, itemId: string) => void;
  onNavigationChange: () => void;
  depth?: number;
  parentPath?: string;
}

interface NavigationItemProps {
  item: NavigationItem;
  index: number;
  sectionId: string;
  pendingDeletions: PendingDeletion[];
  onTogglePendingDeletion: (sectionId: string, itemId: string) => void;
  onNavigationChange: () => void;
  depth: number;
  parentPath: string;
}

function NavigationItemComponent({ 
  item, 
  index, 
  sectionId, 
  pendingDeletions, 
  onTogglePendingDeletion, 
  onNavigationChange,
  depth,
  parentPath
}: NavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const paddingLeft = depth * 16;
  
  const hasChildren = item.items && item.items.length > 0;
  const itemPath = `${parentPath}.${index}`;
  
  // Find if this item is pending deletion using item ID
  const isPendingDeletion = pendingDeletions.some(
    deletion => deletion.sectionId === sectionId && deletion.itemId === item.id
  );

  return (
    <Draggable draggableId={`${sectionId}-${item.id}`} index={index}>
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
              onClick={() => onTogglePendingDeletion(sectionId, item.id)}
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
              <NavigationItemList
                sectionId={sectionId}
                items={item.items!}
                pendingDeletions={pendingDeletions}
                onTogglePendingDeletion={onTogglePendingDeletion}
                onNavigationChange={onNavigationChange}
                depth={depth + 1}
                parentPath={itemPath}
              />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export function NavigationItemList({ 
  sectionId, 
  items, 
  pendingDeletions, 
  onTogglePendingDeletion, 
  onNavigationChange,
  depth = 0,
  parentPath = ""
}: NavigationItemListProps) {
  // Remove the drag handling from this component since it's handled in NavigationStructurePanel
  // This component is now just for display

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No items in this section</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item, index) => (
        <NavigationItemComponent
          key={item.id}
          item={item}
          index={index}
          sectionId={sectionId}
          pendingDeletions={pendingDeletions}
          onTogglePendingDeletion={onTogglePendingDeletion}
          onNavigationChange={onNavigationChange}
          depth={depth}
          parentPath={parentPath}
        />
      ))}
    </div>
  );
}
