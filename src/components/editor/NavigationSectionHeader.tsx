
import { useState } from "react";
import { 
  GripVertical, 
  Edit2, 
  Check, 
  X, 
  Trash2, 
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationSection } from "@/services/navigationService";
import { PendingDeletion } from "./hooks/usePendingDeletions";
import { toast } from "sonner";

interface NavigationSectionHeaderProps {
  section: NavigationSection;
  pendingDeletions: PendingDeletion[];
  onUpdateTitle: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  dragHandleProps?: any;
}

export function NavigationSectionHeader({
  section,
  pendingDeletions,
  onUpdateTitle,
  onDeleteSection,
  dragHandleProps
}: NavigationSectionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSaveTitle = async () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditTitle(section.title);
      setIsEditing(false);
      return;
    }

    if (trimmedTitle === section.title) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateTitle(section.id, trimmedTitle);
      setIsEditing(false);
      toast.success("Section title updated");
    } catch (error) {
      console.error('Failed to update section title:', error);
      setEditTitle(section.title);
      toast.error("Failed to update section title");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(section.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteSection = async () => {
    if (isDeleting) return;
    
    const hasItems = section.items && section.items.length > 0;
    const hasItemsMessage = hasItems 
      ? `This section contains ${section.items.length} item(s). All items will be deleted. ` 
      : '';
    
    if (!confirm(`${hasItemsMessage}Are you sure you want to delete the section "${section.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Deleting section:', section.id);
      await onDeleteSection(section.id);
      toast.success(`Section "${section.title}" deleted`);
    } catch (error) {
      console.error('Failed to delete section:', error);
      toast.error("Failed to delete section");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasPendingDeletions = pendingDeletions.some(
    deletion => deletion.sectionId === section.id
  );

  return (
    <div className="p-3 border-b bg-background">
      <div className="flex items-center gap-2 group">
        <div 
          {...dragHandleProps} 
          className="cursor-grab hover:cursor-grabbing flex-shrink-0 p-1 rounded hover:bg-muted/50"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

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

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-7 text-sm font-semibold"
                autoFocus
                onBlur={handleSaveTitle}
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
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-semibold text-sm truncate flex-1">
                {section.title}
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/10 flex-shrink-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {section.items?.length || 0} items
            </span>
            {hasPendingDeletions && (
              <span className="text-xs text-destructive font-medium">
                Has pending deletions
              </span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant="destructive"
          onClick={handleDeleteSection}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}
