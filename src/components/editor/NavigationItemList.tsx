
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
import { NavigationItem, navigationService } from "@/services/navigationService";
import { PendingDeletion } from "./hooks/usePendingDeletions";

interface NavigationItemListProps {
  sectionId: string;
  items: NavigationItem[];
  pendingDeletions: PendingDeletion[];
  onTogglePendingDeletion: (sectionId: string, itemIndex: number) => void;
  onNavigationChange: () => void;
  depth?: number;
  parentPath?: string;
}

interface NavigationItemProps {
  item: NavigationItem;
  index: number;
  sectionId: string;
  pendingDeletions: PendingDeletion[];
  onTogglePendingDeletion: (sectionId: string, itemIndex: number) => void;
  onNavigationChange: () => void;
  depth: number;
  parentPath: string;
  globalIndex: number;
}

function NavigationItemComponent({ 
  item, 
  index, 
  sectionId, 
  pendingDeletions, 
  onTogglePendingDeletion, 
  onNavigationChange,
  depth,
  parentPath,
  globalIndex
}: NavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const paddingLeft = depth * 16;
  
  const hasChildren = item.items && item.items.length > 0;
  const itemPath = `${parentPath}.${index}`;
  
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
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Only handle item reordering within the same section
    if (source.droppableId === destination.droppableId) {
      try {
        // Update order in database
        const sourceItem = items[source.index];
        const destinationItem = items[destination.index];
        
        await navigationService.updateNavigationItem(sourceItem.id, {
          order_index: destination.index
        });
        
        if (destinationItem) {
          await navigationService.updateNavigationItem(destinationItem.id, {
            order_index: source.index
          });
        }
        
        onNavigationChange();
      } catch (error) {
        console.error('Error reordering items:', error);
      }
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No items in this section</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`${sectionId}-${parentPath}`} type="ITEM">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {items.map((item, index) => {
              // Calculate global index for proper deletion tracking
              const globalIndex = depth === 0 ? index : parseInt(parentPath.split('.').pop() || '0') + index;
              
              return (
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
                  globalIndex={globalIndex}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
