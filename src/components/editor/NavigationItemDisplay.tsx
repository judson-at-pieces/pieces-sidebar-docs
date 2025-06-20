
import { useState, useEffect } from "react";
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
  X,
  Lock,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NavigationItem } from "@/services/navigationService";
import { PendingDeletion } from "./hooks/usePendingDeletions";
import { Draggable, Droppable } from "@hello-pangea/dnd";

interface NavigationItemDisplayProps {
  item: NavigationItem;
  index: number;
  sectionId: string;
  pendingDeletions: PendingDeletion[];
  onTogglePendingDeletion: (sectionId: string, itemId: string) => void;
  onUpdateTitle: (itemId: string, newTitle: string) => void;
  onMoveUp?: (itemId: string) => void;
  onMoveDown?: (itemId: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  depth?: number;
}

export function NavigationItemDisplay({ 
  item, 
  index, 
  sectionId, 
  pendingDeletions, 
  onTogglePendingDeletion,
  onUpdateTitle,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  depth = 0
}: NavigationItemDisplayProps) {
  // Start with folders collapsed by default for better UX
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const paddingLeft = depth * 16;
  
  // Update editTitle when item.title changes from external updates
  useEffect(() => {
    setEditTitle(item.title);
  }, [item.title]);
  
  const children = item.items || [];
  const hasChildren = children.length > 0;
  const isPrivate = item.privacy === 'PRIVATE';
  
  // Find if this item is pending deletion using item ID
  const isPendingDeletion = pendingDeletions.some(
    deletion => deletion.sectionId === sectionId && deletion.itemId === item.id
  );

  const handleSaveTitle = async () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditTitle(item.title);
      setIsEditing(false);
      return;
    }

    if (trimmedTitle === item.title) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      console.log('Updating title for item:', item.id, 'from', item.title, 'to', trimmedTitle);
      await onUpdateTitle(item.id, trimmedTitle);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update title:', error);
      setEditTitle(item.title); // Reset to original title on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(item.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleStartEdit = () => {
    setEditTitle(item.title);
    setIsEditing(true);
  };

  return (
    <>
      <Draggable draggableId={`${sectionId}-${item.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`transition-all ${snapshot.isDragging ? 'opacity-90 z-50 shadow-lg ring-2 ring-primary/30' : ''}`}
          >
            <div 
              className={`p-2 mb-1 border rounded-lg flex items-center gap-2 transition-all group ${
                isPendingDeletion 
                  ? 'border-destructive bg-destructive/10' 
                  : snapshot.isDragging 
                    ? 'bg-background border-primary shadow-md scale-105' 
                    : isPrivate
                      ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                      : 'hover:bg-accent/50 hover:border-accent'
              }`}
              style={{ marginLeft: paddingLeft }}
            >
              <div 
                {...provided.dragHandleProps} 
                className="cursor-grab hover:cursor-grabbing flex-shrink-0 p-1 rounded hover:bg-muted/50"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Up/Down arrow buttons - now available at all levels */}
              {(onMoveUp || onMoveDown) && (
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-primary/20"
                    onClick={() => onMoveUp?.(item.id)}
                    disabled={!canMoveUp}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-primary/20"
                    onClick={() => onMoveDown?.(item.id)}
                    disabled={!canMoveDown}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/10 flex-shrink-0"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              {hasChildren && (
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Folder className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              )}
              
              {isPrivate && (
                <div className="flex-shrink-0">
                  <Lock className="h-3 w-3 text-orange-600" />
                </div>
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
                      disabled={isUpdating}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveTitle}
                      className="h-6 w-6 p-0 flex-shrink-0"
                      disabled={isUpdating}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-6 w-6 p-0 flex-shrink-0"
                      disabled={isUpdating}
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-sm font-medium truncate flex-1 ${isPrivate ? 'text-orange-800' : ''}`}>
                        {item.title}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleStartEdit}
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/10 flex-shrink-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className={`text-xs truncate ${isPrivate ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {item.href}
                      {isPrivate && <span className="ml-2 font-medium">(Private)</span>}
                    </div>
                    {hasChildren && (
                      <Badge variant={isPrivate ? "outline" : "secondary"} className="text-xs mt-1">
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
                className={`h-6 w-6 p-0 transition-all flex-shrink-0 ${
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
          <Droppable droppableId={`section-${sectionId}-folder-${item.id}`} type="item">
            {(folderProvided, folderSnapshot) => (
              <div
                {...folderProvided.droppableProps}
                ref={folderProvided.innerRef}
                className={`ml-4 space-y-1 min-h-[20px] rounded-md p-2 transition-all ${
                  folderSnapshot.isDraggingOver 
                    ? 'bg-primary/5 border-2 border-dashed border-primary/30' 
                    : 'border-2 border-dashed border-transparent hover:border-muted-foreground/20'
                }`}
                style={{ marginLeft: paddingLeft + 16 }}
              >
                {children.map((childItem, childIndex) => (
                  <NavigationItemDisplay
                    key={childItem.id}
                    item={childItem}
                    index={childIndex}
                    sectionId={sectionId}
                    pendingDeletions={pendingDeletions}
                    onTogglePendingDeletion={onTogglePendingDeletion}
                    onUpdateTitle={onUpdateTitle}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    canMoveUp={childIndex > 0}
                    canMoveDown={childIndex < children.length - 1}
                    depth={depth + 1}
                  />
                ))}
                {folderProvided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </>
  );
}
