
import { useState } from "react";
import { Settings, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NavigationSection } from "@/services/navigationService";
import { PendingDeletion } from "./hooks/usePendingDeletions";

interface NavigationSectionHeaderProps {
  section: NavigationSection;
  pendingDeletions: PendingDeletion[];
  onUpdateTitle: (sectionId: string, title: string) => void;
  dragHandleProps: any;
}

export function NavigationSectionHeader({ 
  section, 
  pendingDeletions, 
  onUpdateTitle, 
  dragHandleProps 
}: NavigationSectionHeaderProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

  const handleEditSection = (section: NavigationSection) => {
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title);
  };

  const handleSaveEdit = () => {
    if (editingSectionId && editingSectionTitle.trim()) {
      onUpdateTitle(editingSectionId, editingSectionTitle.trim());
      setEditingSectionId(null);
      setEditingSectionTitle("");
    }
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditingSectionTitle("");
  };

  return (
    <div className="p-3 border-b border-border bg-muted/20">
      <div className="flex items-center gap-3">
        <div {...dragHandleProps} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {editingSectionId === section.id ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editingSectionTitle}
              onChange={(e) => setEditingSectionTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleSaveEdit}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{section.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {section.items?.length || 0} items
                </Badge>
                {pendingDeletions.filter(d => d.sectionId === section.id).length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {pendingDeletions.filter(d => d.sectionId === section.id).length} pending deletion
                  </Badge>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditSection(section)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
