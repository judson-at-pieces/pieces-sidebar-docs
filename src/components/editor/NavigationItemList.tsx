
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, FileText, Folder, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationItem } from "@/services/navigationService";
import { PendingDeletion } from "./hooks/usePendingDeletions";

interface NavigationItemListProps {
  sectionId: string;
  items: NavigationItem[];
  pendingDeletions: PendingDeletion[];
  onTogglePendingDeletion: (sectionId: string, itemIndex: number) => void;
  onNavigationChange: () => void;
}

export function NavigationItemList({ 
  sectionId, 
  items, 
  pendingDeletions,
  onTogglePendingDeletion,
  onNavigationChange 
}: NavigationItemListProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    // Drag end will be handled by parent component
    onNavigationChange();
  };

  const isPendingDeletion = (itemIndex: number) => {
    return pendingDeletions.some(d => d.sectionId === sectionId && d.itemIndex === itemIndex);
  };

  const renderItem = (item: NavigationItem, index: number, depth = 0) => {
    const hasChildren = item.items && item.items.length > 0;
    const paddingLeft = depth * 16;
    const isSelected = isPendingDeletion(index);

    return (
      <div key={item.id} style={{ marginLeft: paddingLeft }}>
        <Draggable draggableId={`item-${item.id}`} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              className={`group flex items-center gap-2 p-2 rounded border transition-all ${
                isSelected 
                  ? 'border-destructive bg-destructive/10' 
                  : snapshot.isDragging 
                    ? 'shadow-lg border-primary bg-primary/5' 
                    : 'border-border hover:bg-accent/50'
              }`}
            >
              <div {...provided.dragHandleProps} className="cursor-grab hover:cursor-grabbing">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
              
              {hasChildren ? (
                <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              
              <span className="flex-1 text-sm truncate">{item.title}</span>
              
              <Button
                size="sm"
                variant={isSelected ? "default" : "ghost"}
                onClick={() => onTogglePendingDeletion(sectionId, index)}
                className={`h-6 w-6 p-0 transition-all ${
                  isSelected 
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                    : 'opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground'
                }`}
              >
                {isSelected ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <div className="h-3 w-3 border border-current rounded-sm" />
                )}
              </Button>
            </div>
          )}
        </Draggable>
        
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.items!.map((childItem, childIndex) => 
              renderItem(childItem, childIndex, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No items in this section</p>
        <p className="text-xs">Drag files from the left panel to add them</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`section-${sectionId}`} type="ITEM">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
            {items.map((item, index) => renderItem(item, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
