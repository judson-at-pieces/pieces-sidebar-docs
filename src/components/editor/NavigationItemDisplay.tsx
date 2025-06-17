
import { useState } from "react";
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight,
  GripVertical,
  Check,
  Trash2,
  Edit2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NavigationItem } from "@/services/navigationService";
import { PendingDeletion } from "./hooks/usePendingDeletions";
import { Draggable } from "@hello-pangea/dnd";

interface NavigationItemDisplayProps {
  item: NavigationItem;
  index: number;
  sectionId: string;
  pendingDeletions: PendingDeletion[];
  onTogglePendingDeletion: (sectionId: string, itemId: string) => void;
  onUpdateTitle: (itemId: string, newTitle: string) => void;
  depth?: number;
  globalIndex?: number;
}

// Helper function to calculate global flattened index
const calculateGlobalIndex = (items: NavigationItem[], targetId: string, currentIndex = 0): number => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.id === targetId) {
      return currentIndex;
    }
    currentIndex++;
    
    if (item.items && item.items.length > 0) {
      const foundIndex = calculateGlobalIndex(item.items, targetId, currentIndex);
      if (foundIndex !== -1) {
        return foundIndex;
      }
      currentIndex += countAllItems(item.items);
    }
  }
  return -1;
};

const countAllItems = (items: NavigationItem[]): number => {
  let count = 0;
  items.forEach(item => {
    count++;
    if (item.items) {
      count += countAllItems(item.items);
    }
  });
  return count;
};

export function NavigationItemDisplay({ 
  item, 
  index, 
  sectionId, 
  pendingDeletions, 
  onTogglePendingDeletion,
  onUpdateTitle,
  depth = 0,
  globalIndex
}: NavigationItemDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const paddingLeft = depth * 16;
  
  const children = item.items || [];
  const hasChildren = children.length > 0;
  
  // Find if this item is pending deletion using item ID
  const isPendingDeletion = pendingDeletions.some(
    deletion => deletion.sectionId === sectionId && deletion.itemId === item.id
  );

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== item.title) {
      onUpdateTitle(item.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(item.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Use globalIndex if provided, otherwise use index
  const dragIndex = globalIndex !== undefined ? globalIndex : index;

  return (
    <>
      <Draggable draggableId={`${sectionId}-${item.id}`} index={dragIndex}>
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
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="h-6 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveTitle}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate block">
                        {item.title}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/10"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.href}
                    </div>
                    {hasChildren && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {children.length} items
                      </Badge>
                    )}
                  </>
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
          </div>
        )}
      </Draggable>
      
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {children.map((childItem, childIndex) => (
            <NavigationItemDisplay
              key={childItem.id}
              item={childItem}
              index={childIndex}
              sectionId={sectionId}
              pendingDeletions={pendingDeletions}
              onTogglePendingDeletion={onTogglePendingDeletion}
              onUpdateTitle={onUpdateTitle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}
