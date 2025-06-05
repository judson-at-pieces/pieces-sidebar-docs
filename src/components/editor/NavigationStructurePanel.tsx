
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Settings, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NavigationSection } from "@/services/navigationService";
import { NavigationSectionHeader } from "./NavigationSectionHeader";
import { NavigationItemDisplay } from "./NavigationItemDisplay";
import { PendingDeletion } from "./hooks/usePendingDeletions";

interface NavigationStructurePanelProps {
  sections: NavigationSection[];
  pendingDeletions: PendingDeletion[];
  onAddSection: (title: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
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
  onTogglePendingDeletion,
  onBulkDelete,
  onResetPendingDeletions,
  onSectionReorder,
  onNavigationChange 
}: NavigationStructurePanelProps) {
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      onAddSection(newSectionTitle.trim());
      setNewSectionTitle("");
      setShowAddDialog(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Only handle section reordering here
    if (source.droppableId === 'sections' && destination.droppableId === 'sections') {
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      // Update order_index for all sections
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order_index: index
      }));
      
      onSectionReorder(updatedSections);
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/50">
      <CardHeader className="pb-4 flex-shrink-0 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Navigation Structure
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingDeletions.length > 0 && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onResetPendingDeletions}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={onBulkDelete}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Delete {pendingDeletions.length}
                </Button>
              </>
            )}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Section</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Section title"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSection} disabled={!newSectionTitle.trim()}>
                      Add Section
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {sections.length} sections • Drag sections to reorder
          {pendingDeletions.length > 0 && (
            <span className="text-destructive font-medium">
              {' • '}{pendingDeletions.length} item{pendingDeletions.length !== 1 ? 's' : ''} selected for deletion
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full w-full">
          <div className="p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections" type="SECTION">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={`section-${section.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-lg transition-all ${
                              snapshot.isDragging ? 'shadow-lg border-primary' : 'border-border'
                            }`}
                          >
                            <NavigationSectionHeader
                              section={section}
                              pendingDeletions={pendingDeletions}
                              onUpdateTitle={onUpdateSectionTitle}
                              dragHandleProps={provided.dragHandleProps}
                            />
                            
                            <div className="p-3">
                              {section.items && section.items.length > 0 ? (
                                <div className="space-y-1">
                                  {section.items.map((item, itemIndex) => (
                                    <NavigationItemDisplay
                                      key={item.id}
                                      item={item}
                                      index={itemIndex}
                                      sectionId={section.id}
                                      pendingDeletions={pendingDeletions}
                                      onTogglePendingDeletion={onTogglePendingDeletion}
                                      globalIndex={itemIndex}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-muted-foreground py-4">
                                  <p className="text-sm">No items in this section</p>
                                </div>
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
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
