
import { useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, RotateCcw, RefreshCw } from "lucide-react";
import { NavigationSection } from "@/services/navigationService";
import { NavigationItemDisplay } from "./NavigationItemDisplay";
import { PendingDeletion } from "./hooks/usePendingDeletions";
import { toast } from "sonner";

interface NavigationStructurePanelProps {
  sections: NavigationSection[];
  pendingDeletions: PendingDeletion[];
  onAddSection: (title: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onUpdateItemTitle: (itemId: string, title: string) => void;
  onTogglePendingDeletion: (sectionId: string, itemIndex: number) => void;
  onBulkDelete: () => void;
  onResetPendingDeletions: () => void;
  onSectionReorder: (newSections: NavigationSection[]) => void;
  onNavigationChange: () => void;
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
  onNavigationChange
}: NavigationStructurePanelProps) {
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      onAddSection(newSectionTitle.trim());
      setNewSectionTitle("");
    }
  };

  const handleStartEditSection = (sectionId: string, currentTitle: string) => {
    setEditingSectionId(sectionId);
    setEditSectionTitle(currentTitle);
  };

  const handleSaveSectionTitle = () => {
    if (editingSectionId && editSectionTitle.trim()) {
      onUpdateSectionTitle(editingSectionId, editSectionTitle.trim());
      setEditingSectionId(null);
      setEditSectionTitle("");
    }
  };

  const handleCancelEditSection = () => {
    setEditingSectionId(null);
    setEditSectionTitle("");
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Handle section reordering
    if (source.droppableId === 'sections' && destination.droppableId === 'sections') {
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      onSectionReorder(newSections);
    }
  };

  // Calculate global indices for items
  const getGlobalIndex = (sectionIndex: number, itemIndex: number): number => {
    let globalIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
      globalIndex += sections[i].items?.length || 0;
    }
    return globalIndex + itemIndex;
  };

  return (
    <div className="h-full flex flex-col border rounded-lg bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Navigation Structure</h3>
          <Button
            onClick={onNavigationChange}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="section-title">Add New Section</Label>
          <div className="flex gap-2">
            <Input
              id="section-title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Section title..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
            />
            <Button onClick={handleAddSection} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {pendingDeletions.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {pendingDeletions.length} item{pendingDeletions.length !== 1 ? 's' : ''} marked for deletion
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={onResetPendingDeletions}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={onBulkDelete}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections" type="section">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {sections.map((section, sectionIndex) => (
                    <div key={section.id} className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        {editingSectionId === section.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editSectionTitle}
                              onChange={(e) => setEditSectionTitle(e.target.value)}
                              className="text-base font-semibold"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSaveSectionTitle();
                                if (e.key === 'Escape') handleCancelEditSection();
                              }}
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveSectionTitle} variant="ghost">
                              ✓
                            </Button>
                            <Button size="sm" onClick={handleCancelEditSection} variant="ghost">
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <h4 
                            className="text-base font-semibold cursor-pointer hover:text-primary"
                            onClick={() => handleStartEditSection(section.id, section.title)}
                          >
                            {section.title}
                          </h4>
                        )}
                      </div>
                      
                      <Droppable droppableId={`section-${section.id}`} type="item">
                        {(sectionProvided) => (
                          <div
                            {...sectionProvided.droppableProps}
                            ref={sectionProvided.innerRef}
                            className="space-y-1"
                          >
                            {section.items?.map((item, itemIndex) => {
                              const globalIndex = getGlobalIndex(sectionIndex, itemIndex);
                              return (
                                <NavigationItemDisplay
                                  key={item.id}
                                  item={item}
                                  index={itemIndex}
                                  sectionId={section.id}
                                  pendingDeletions={pendingDeletions}
                                  onTogglePendingDeletion={onTogglePendingDeletion}
                                  onUpdateTitle={onUpdateItemTitle}
                                  globalIndex={globalIndex}
                                />
                              );
                            })}
                            {sectionProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      
                      {(!section.items || section.items.length === 0) && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                          No items in this section. Add files from the left panel.
                        </p>
                      )}
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </ScrollArea>
    </div>
  );
}
