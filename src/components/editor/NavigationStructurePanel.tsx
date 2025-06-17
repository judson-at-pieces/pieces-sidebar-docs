
import React, { useState } from "react";
import { Plus, Trash2, RotateCcw, GripVertical, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { NavigationSection, NavigationItem } from "@/services/navigationService";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { ItemActionsButton } from "./ItemActionsButton";
import { ItemSettingsPanel } from "./ItemSettingsPanel";

interface NavigationStructurePanelProps {
  sections: NavigationSection[];
  pendingDeletions: Array<{ sectionId: string; itemIndex: number; item: NavigationItem }>;
  onAddSection: (title: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onUpdateItemTitle: (itemId: string, title: string) => void;
  onTogglePendingDeletion: (sectionId: string, itemIndex: number) => void;
  onBulkDelete: () => void;
  onResetPendingDeletions: () => void;
  onSectionReorder: (newSections: NavigationSection[]) => void;
  onNavigationChange: () => void;
  onPrivacyChange: (itemId: string, privacy: 'PUBLIC' | 'PRIVATE') => void;
}

export function NavigationStructurePanel({
  sections,
  pendingDeletions,
  onAddSection,
  onUpdateSectionTitle,
  onUpdateItemTitle,
  onTogglePendingDeletion,
  onBulkDelete,
  onResetPendingDeletions,
  onSectionReorder,
  onNavigationChange,
  onPrivacyChange
}: NavigationStructurePanelProps) {
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [settingsItem, setSettingsItem] = useState<NavigationItem | null>(null);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  const { handleDragEnd } = useDragAndDrop(sections, onSectionReorder);

  const isPendingDeletion = (sectionId: string, itemIndex: number) => {
    return pendingDeletions.some(
      (deletion) => deletion.sectionId === sectionId && deletion.itemIndex === itemIndex
    );
  };

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      onAddSection(newSectionTitle.trim());
      setNewSectionTitle("");
    }
  };

  const handleSectionTitleClick = (section: NavigationSection) => {
    setEditingSectionId(section.id);
    setEditingTitle(section.title);
  };

  const handleItemTitleClick = (item: NavigationItem) => {
    setEditingItemId(item.id);
    setEditingTitle(item.title);
  };

  const handleSectionTitleSave = () => {
    if (editingSectionId && editingTitle.trim()) {
      onUpdateSectionTitle(editingSectionId, editingTitle.trim());
    }
    setEditingSectionId(null);
    setEditingTitle("");
  };

  const handleItemTitleSave = () => {
    if (editingItemId && editingTitle.trim()) {
      onUpdateItemTitle(editingItemId, editingTitle.trim());
    }
    setEditingItemId(null);
    setEditingTitle("");
  };

  const handleSettingsClick = (item: NavigationItem) => {
    setSettingsItem(item);
    setSettingsPanelOpen(true);
  };

  const handlePrivacyChange = (itemId: string, privacy: 'PUBLIC' | 'PRIVATE') => {
    onPrivacyChange(itemId, privacy);
    onNavigationChange();
  };

  const renderNavItem = (item: NavigationItem, sectionId: string, itemIndex: number, depth = 0) => {
    const isMarkedForDeletion = isPendingDeletion(sectionId, itemIndex);
    const isEditing = editingItemId === item.id;
    const isPrivate = item.privacy === 'PRIVATE';

    return (
      <div 
        key={item.id}
        className={`group flex items-center gap-2 p-2 rounded-lg transition-colors ${
          isMarkedForDeletion ? 'bg-destructive/10 border border-destructive/20' : 'hover:bg-accent'
        } ${depth > 0 ? 'ml-6' : ''}`}
      >
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleItemTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleItemTitleSave();
                if (e.key === 'Escape') {
                  setEditingItemId(null);
                  setEditingTitle("");
                }
              }}
              className="h-6 text-sm"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <span 
                className={`text-sm cursor-pointer truncate ${
                  isMarkedForDeletion ? 'line-through text-muted-foreground' : ''
                }`}
                onClick={() => handleItemTitleClick(item)}
              >
                {item.title}
              </span>
              {isPrivate && (
                <Lock className="h-3 w-3 text-destructive flex-shrink-0" />
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <ItemActionsButton
            onSettingsClick={() => handleSettingsClick(item)}
            onDeleteClick={() => onTogglePendingDeletion(sectionId, itemIndex)}
          />
        </div>

        {item.items && item.items.length > 0 && (
          <div className="ml-4 space-y-1">
            {item.items.map((subItem, subIndex) => 
              renderNavItem(subItem, sectionId, itemIndex + subIndex + 1, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Navigation Structure</h3>
          {pendingDeletions.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1">
                <Trash2 className="h-3 w-3" />
                {pendingDeletions.length} marked
              </Badge>
              <Button onClick={onBulkDelete} size="sm" variant="destructive">
                Delete All
              </Button>
              <Button onClick={onResetPendingDeletions} size="sm" variant="outline">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="New section title..."
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSection();
            }}
          />
          <Button onClick={handleAddSection} disabled={!newSectionTitle.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <ScrollArea className="h-[calc(100vh-20rem)]">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {sections.map((section, index) => (
                    <Draggable
                      key={section.id}
                      draggableId={section.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border rounded-lg p-4 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {editingSectionId === section.id ? (
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={handleSectionTitleSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSectionTitleSave();
                                  if (e.key === 'Escape') {
                                    setEditingSectionId(null);
                                    setEditingTitle("");
                                  }
                                }}
                                className="flex-1"
                                autoFocus
                              />
                            ) : (
                              <h4 
                                className="font-medium flex-1 cursor-pointer hover:text-primary"
                                onClick={() => handleSectionTitleClick(section)}
                              >
                                {section.title}
                              </h4>
                            )}
                            <Badge variant="secondary">
                              {section.items?.length || 0} items
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            {section.items?.map((item, itemIndex) => 
                              renderNavItem(item, section.id, itemIndex)
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </ScrollArea>
      </div>

      <ItemSettingsPanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        item={settingsItem}
        onPrivacyChange={handlePrivacyChange}
      />
    </>
  );
}
