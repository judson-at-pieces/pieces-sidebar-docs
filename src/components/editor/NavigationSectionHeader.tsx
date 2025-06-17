
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GripVertical, 
  Edit2, 
  Check, 
  X, 
  Trash2,
  Folder
} from "lucide-react";
import { NavigationSection } from "@/services/navigationService";
import { PendingDeletion } from "./hooks/usePendingDeletions";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NavigationSectionHeaderProps {
  section: NavigationSection;
  pendingDeletions: PendingDeletion[];
  onUpdateTitle: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps;
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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== section.title) {
      onUpdateTitle(section.id, editTitle.trim());
    }
    setIsEditing(false);
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
    setIsDeleting(true);
    try {
      await onDeleteSection(section.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const itemCount = section.items?.length || 0;

  return (
    <div className="flex items-center justify-between p-3 border-b bg-muted/10 group">
      <div className="flex items-center gap-2 flex-1">
        <div {...dragHandleProps} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-7 text-sm font-medium"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSaveTitle}
              className="h-7 w-7 p-0"
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-sm">{section.title}</span>
            <span className="text-xs text-muted-foreground">({itemCount} items)</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/10"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
            title="Delete section"
            disabled={isDeleting}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{section.title}" section? 
              {itemCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  This will also delete {itemCount} navigation item{itemCount !== 1 ? 's' : ''} in this section.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Section"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
