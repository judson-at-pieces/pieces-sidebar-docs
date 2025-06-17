
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, RotateCcw, RefreshCw } from "lucide-react";
import { NavigationSection, navigationService } from "@/services/navigationService";
import { NavigationItemDisplay } from "./NavigationItemDisplay";
import { NavigationSectionHeader } from "./NavigationSectionHeader";
import { PendingDeletion } from "./hooks/usePendingDeletions";
import { toast } from "sonner";

interface NavigationStructurePanelProps {
  sections: NavigationSection[];
  pendingDeletions: PendingDeletion[];
  onAddSection: (title: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onUpdateItemTitle: (itemId: string, title: string) => void;
  onTogglePendingDeletion: (sectionId: string, itemId: string) => void;
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
  onDeleteSection,
  onUpdateItemTitle,
  onTogglePendingDeletion,
  onBulkDelete,
  onResetPendingDeletions,
  onSectionReorder,
  onNavigationChange
}: NavigationStructurePanelProps) {
  const [newSectionTitle, setNewSectionTitle] = useState("");

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      onAddSection(newSectionTitle.trim());
      setNewSectionTitle("");
    }
  };

  // Helper function to find an item by ID recursively
  const findItemById = (items: any[], itemId: string): any => {
    for (const item of items) {
      if (item.id === itemId) return item;
      if (item.items && item.items.length > 0) {
        const found = findItemById(item.items, itemId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to find parent of an item
  const findParentOfItem = (items: any[], itemId: string, parent: any = null): any => {
    for (const item of items) {
      if (item.id === itemId) return parent;
      if (item.items && item.items.length > 0) {
        const found = findParentOfItem(item.items, itemId, item);
        if (found !== null) return found;
      }
    }
    return null;
  };

  // Helper function to update order indices recursively
  const updateOrderIndices = (items: any[]): any[] => {
    return items.map((item, index) => ({
      ...item,
      order_index: index,
      items: item.items ? updateOrderIndices(item.items) : []
    }));
  };

  // Helper function to remove an item from nested structure
  const removeItemFromStructure = (items: any[], itemId: string): any[] => {
    return items.filter(item => {
      if (item.id === itemId) return false;
      if (item.items) {
        item.items = removeItemFromStructure(item.items, itemId);
      }
      return true;
    });
  };

  // Helper function to insert item at specific position
  const insertItemAtPosition = (items: any[], insertIndex: number, itemToInsert: any): any[] => {
    const newItems = [...items];
    newItems.splice(insertIndex, 0, itemToInsert);
    return newItems;
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Handle section reordering
    if (source.droppableId === 'sections' && destination.droppableId === 'sections') {
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      const sectionsWithNewOrder = newSections.map((section, index) => ({
        ...section,
        order_index: index
      }));
      
      onSectionReorder(sectionsWithNewOrder);
      return;
    }

    // Handle item reordering within sections
    if (source.droppableId.startsWith('section-') && destination.droppableId.startsWith('section-')) {
      const sourceSectionId = source.droppableId.replace('section-', '');
      const destSectionId = destination.droppableId.replace('section-', '');
      
      if (sourceSectionId !== destSectionId) {
        toast.error("Moving items between sections not supported yet");
        return;
      }

      try {
        const section = sections.find(s => s.id === sourceSectionId);
        if (!section?.items) return;

        // Parse the draggable ID to get the item ID
        const draggedItemId = result.draggableId.replace(`${sourceSectionId}-`, '');
        const draggedItem = findItemById(section.items, draggedItemId);
        
        if (!draggedItem) {
          console.warn('Could not find dragged item');
          return;
        }

        console.log('Dragging item:', { id: draggedItem.id, title: draggedItem.title });

        // Find the parent of the dragged item
        const draggedParent = findParentOfItem(section.items, draggedItemId);
        
        // Determine the container items (either parent's items or root items)
        const containerItems = draggedParent ? draggedParent.items : section.items;
        
        // Get the current index of the dragged item in its container
        const currentIndex = containerItems.findIndex((item: any) => item.id === draggedItemId);
        
        if (currentIndex === -1) {
          console.warn('Could not find current index of dragged item');
          return;
        }

        // Calculate the new index (accounting for the item being removed first)
        let newIndex = destination.index;
        if (currentIndex < destination.index) {
          newIndex = destination.index - 1;
        }

        // Don't do anything if the position hasn't changed
        if (currentIndex === newIndex) {
          return;
        }

        console.log('Reordering within container:', { currentIndex, newIndex });

        // Create new container items with reordered items
        const newContainerItems = [...containerItems];
        const [movedItem] = newContainerItems.splice(currentIndex, 1);
        newContainerItems.splice(newIndex, 0, movedItem);

        // Update the section with new order
        let newSectionItems;
        if (draggedParent) {
          // Update the parent's items
          newSectionItems = section.items.map((item: any) => {
            if (item.id === draggedParent.id) {
              return { ...item, items: updateOrderIndices(newContainerItems) };
            }
            return item;
          });
        } else {
          // Update root level items
          newSectionItems = updateOrderIndices(newContainerItems);
        }

        // Update all order indices recursively
        const finalItems = updateOrderIndices(newSectionItems);

        // Update database
        const flattenForUpdate = (items: any[]): any[] => {
          const result: any[] = [];
          items.forEach(item => {
            result.push(item);
            if (item.items) {
              result.push(...flattenForUpdate(item.items));
            }
          });
          return result;
        };

        const allItems = flattenForUpdate(finalItems);
        const updatePromises = allItems.map(item => 
          navigationService.updateNavigationItem(item.id, {
            order_index: item.order_index
          })
        );

        await Promise.all(updatePromises);
        
        // Refresh navigation data
        onNavigationChange();
        toast.success("Items reordered successfully");
        
      } catch (error) {
        console.error('Error reordering items:', error);
        toast.error("Failed to reorder items");
        onNavigationChange();
      }
    }
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
                    <Draggable key={section.id} draggableId={section.id} index={sectionIndex}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border rounded-lg bg-muted/20 ${
                            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
                          }`}
                        >
                          <NavigationSectionHeader
                            section={section}
                            pendingDeletions={pendingDeletions}
                            onUpdateTitle={onUpdateSectionTitle}
                            onDeleteSection={onDeleteSection}
                            dragHandleProps={provided.dragHandleProps}
                          />
                          
                          <div className="p-3">
                            <Droppable droppableId={`section-${section.id}`} type="item">
                              {(sectionProvided) => (
                                <div
                                  {...sectionProvided.droppableProps}
                                  ref={sectionProvided.innerRef}
                                  className="space-y-1"
                                >
                                  {section.items?.map((item, itemIndex) => (
                                    <NavigationItemDisplay
                                      key={item.id}
                                      item={item}
                                      index={itemIndex}
                                      sectionId={section.id}
                                      pendingDeletions={pendingDeletions}
                                      onTogglePendingDeletion={onTogglePendingDeletion}
                                      onUpdateTitle={onUpdateItemTitle}
                                    />
                                  ))}
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
    </div>
  );
}
