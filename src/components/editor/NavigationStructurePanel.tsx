
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Settings, Trash2, GripVertical, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { NavigationSection, NavigationItem } from "@/services/navigationService";
import { NavigationItemList } from "./NavigationItemList";
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
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      onAddSection(newSectionTitle.trim());
      setNewSectionTitle("");
      setShowAddDialog(false);
    }
  };

  const handleEditSection = (section: NavigationSection) => {
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title);
  };

  const handleSaveEdit = () => {
    if (editingSectionId && editingSectionTitle.trim()) {
      onUpdateSectionTitle(editingSectionId, editingSectionTitle.trim());
      setEditingSectionId(null);
      setEditingSectionTitle("");
    }
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditingSectionTitle("");
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
                            <div className="p-3 border-b border-border bg-muted/20">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps} className="cursor-grab hover:cursor-grabbing">
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
                            
                            <div className="p-3">
                              <NavigationItemList
                                sectionId={section.id}
                                items={section.items || []}
                                pendingDeletions={pendingDeletions}
                                onTogglePendingDeletion={onTogglePendingDeletion}
                                onNavigationChange={onNavigationChange}
                              />
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
