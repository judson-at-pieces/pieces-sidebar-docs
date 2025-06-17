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
  const [isAddingSection, setIsAddingSection] = useState(false);

  const handleAddSection = async () => {
    if (!newSectionTitle.trim() || isAddingSection) {
      return;
    }

    setIsAddingSection(true);
    try {
      console.log('Adding new section:', newSectionTitle.trim());
      await onAddSection(newSectionTitle.trim());
      setNewSectionTitle("");
      toast.success(`Added section: ${newSectionTitle.trim()}`);
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error("Failed to add section");
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAddingSection) {
      handleAddSection();
    }
  };

  // Helper function to update order indices recursively
  const updateOrderIndices = (items: any[]): any[] => {
    return items.map((item, index) => ({
      ...item,
      order_index: index,
      items: item.items ? updateOrderIndices(item.items) : []
    }));
  };

  // Helper function to find an item by ID in nested structure
  const findItemById = (items: any[], itemId: string): any | null => {
    for (const item of items) {
      if (item.id === itemId) return item;
      if (item.items) {
        const found = findItemById(item.items, itemId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to find parent of an item
  const findParentOfItem = (items: any[], itemId: string, parentId?: string): { parent: any | null, parentId: string | null } => {
    for (const item of items) {
      if (item.id === itemId) {
        return { parent: null, parentId: parentId || null };
      }
      if (item.items) {
        const found = findParentOfItem(item.items, itemId, item.id);
        if (found.parent !== undefined) return found;
      }
    }
    return { parent: undefined, parentId: null };
  };

  // Helper function to remove item from nested structure
  const removeItemFromStructure = (items: any[], itemId: string): { items: any[], removedItem: any | null } => {
    const newItems = [...items];
    
    for (let i = 0; i < newItems.length; i++) {
      if (newItems[i].id === itemId) {
        const removedItem = newItems[i];
        newItems.splice(i, 1);
        return { items: newItems, removedItem };
      }
      
      if (newItems[i].items) {
        const result = removeItemFromStructure(newItems[i].items, itemId);
        if (result.removedItem) {
          newItems[i] = { ...newItems[i], items: result.items };
          return { items: newItems, removedItem: result.removedItem };
        }
      }
    }
    
    return { items: newItems, removedItem: null };
  };

  // Helper function to insert item at specific position in nested structure
  const insertItemInStructure = (items: any[], item: any, parentId: string | null, index: number): any[] => {
    if (!parentId) {
      // Insert at root level
      const newItems = [...items];
      newItems.splice(index, 0, item);
      return newItems;
    }
    
    // Insert into specific parent
    return items.map(currentItem => {
      if (currentItem.id === parentId) {
        const newChildren = [...(currentItem.items || [])];
        newChildren.splice(index, 0, item);
        return { ...currentItem, items: newChildren };
      }
      
      if (currentItem.items) {
        return {
          ...currentItem,
          items: insertItemInStructure(currentItem.items, item, parentId, index)
        };
      }
      
      return currentItem;
    });
  };

  const handleMoveItem = async (sectionId: string, itemId: string, direction: 'up' | 'down') => {
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section?.items) return;

      // Find the item and its parent
      const { parentId } = findParentOfItem(section.items, itemId);
      
      let itemsToReorder: any[];
      let currentIndex: number;
      
      if (!parentId) {
        // Root level item
        itemsToReorder = [...section.items];
        currentIndex = itemsToReorder.findIndex(item => item.id === itemId);
      } else {
        // Nested item - find parent's children
        const parentItem = findItemById(section.items, parentId);
        if (!parentItem?.items) return;
        itemsToReorder = [...parentItem.items];
        currentIndex = itemsToReorder.findIndex(item => item.id === itemId);
      }
      
      if (currentIndex === -1) return;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= itemsToReorder.length) return;

      // Swap items
      [itemsToReorder[currentIndex], itemsToReorder[newIndex]] = [itemsToReorder[newIndex], itemsToReorder[currentIndex]];
      
      // Update order indices
      const finalItems = updateOrderIndices(itemsToReorder);

      // Update database with new order indices
      const updatePromises = finalItems.map(item => 
        navigationService.updateNavigationItem(item.id, {
          order_index: item.order_index
        })
      );

      await Promise.all(updatePromises);
      
      // Refresh navigation data
      onNavigationChange();
      toast.success("Items reordered successfully");
      
    } catch (error) {
      console.error('Error moving item:', error);
      toast.error("Failed to reorder items");
      onNavigationChange();
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    console.log('Drag result:', {
      source: source.droppableId,
      destination: destination.droppableId,
      draggableId: result.draggableId
    });

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

    // Parse droppable IDs to extract section and parent information
    const parseDroppableId = (droppableId: string) => {
      if (droppableId.startsWith('section-')) {
        const parts = droppableId.replace('section-', '').split('-folder-');
        return {
          sectionId: parts[0],
          parentId: parts[1] || null
        };
      }
      return null;
    };

    const sourceInfo = parseDroppableId(source.droppableId);
    const destInfo = parseDroppableId(destination.droppableId);

    if (!sourceInfo || !destInfo) {
      console.log('Could not parse droppable IDs');
      return;
    }

    // Only handle reordering within the same section for now
    if (sourceInfo.sectionId !== destInfo.sectionId) {
      toast.error("Moving items between sections not supported yet");
      return;
    }

    try {
      const section = sections.find(s => s.id === sourceInfo.sectionId);
      if (!section?.items) return;

      // Parse the draggable ID to get the item ID
      const draggedItemId = result.draggableId.replace(`${sourceInfo.sectionId}-`, '');
      
      console.log('Moving item:', {
        sectionId: sourceInfo.sectionId,
        draggedItemId,
        sourceParentId: sourceInfo.parentId,
        destParentId: destInfo.parentId,
        sourceIndex: source.index,
        destIndex: destination.index
      });

      // Remove item from source location
      const { items: itemsAfterRemoval, removedItem } = removeItemFromStructure(section.items, draggedItemId);
      
      if (!removedItem) {
        console.warn('Could not find dragged item');
        return;
      }

      // Update parent_id and insert item at destination
      const updatedItem = {
        ...removedItem,
        parent_id: destInfo.parentId
      };

      // Insert item at destination
      const finalItems = insertItemInStructure(itemsAfterRemoval, updatedItem, destInfo.parentId, destination.index);
      
      // Update order indices for all affected items
      const itemsWithOrderIndices = updateOrderIndices(finalItems);

      console.log('Final reordered structure:', itemsWithOrderIndices);

      // Update database with new structure
      const updatePromises = [];
      
      // Update the moved item's parent_id
      updatePromises.push(
        navigationService.updateNavigationItem(draggedItemId, {
          parent_id: destInfo.parentId,
          order_index: destination.index
        })
      );

      // Update order indices for all items in the section
      const flattenItems = (items: any[]): any[] => {
        const result: any[] = [];
        for (const item of items) {
          result.push(item);
          if (item.items) {
            result.push(...flattenItems(item.items));
          }
        }
        return result;
      };

      const allItems = flattenItems(itemsWithOrderIndices);
      allItems.forEach(item => {
        updatePromises.push(
          navigationService.updateNavigationItem(item.id, {
            order_index: item.order_index
          })
        );
      });

      await Promise.all(updatePromises);
      
      console.log('All items updated successfully');
      
      // Refresh navigation data
      onNavigationChange();
      toast.success("Items reordered successfully");
      
    } catch (error) {
      console.error('Error reordering items:', error);
      toast.error("Failed to reorder items");
      onNavigationChange();
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
              onKeyPress={handleKeyPress}
              disabled={isAddingSection}
            />
            <Button 
              onClick={handleAddSection} 
              size="sm"
              disabled={!newSectionTitle.trim() || isAddingSection}
            >
              {isAddingSection ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
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
                          className={`border rounded-lg bg-muted/20 transition-all ${
                            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20 bg-background' : ''
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
                              {(sectionProvided, sectionSnapshot) => (
                                <div
                                  {...sectionProvided.droppableProps}
                                  ref={sectionProvided.innerRef}
                                  className={`space-y-1 min-h-[40px] rounded-md p-2 transition-all ${
                                    sectionSnapshot.isDraggingOver 
                                      ? 'bg-primary/5 border-2 border-dashed border-primary/30' 
                                      : 'border-2 border-dashed border-transparent hover:border-muted-foreground/20'
                                  }`}
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
                                      onMoveUp={(itemId) => handleMoveItem(section.id, itemId, 'up')}
                                      onMoveDown={(itemId) => handleMoveItem(section.id, itemId, 'down')}
                                      canMoveUp={itemIndex > 0}
                                      canMoveDown={itemIndex < (section.items?.length || 0) - 1}
                                    />
                                  ))}
                                  
                                  {sectionProvided.placeholder}
                                  
                                  {(!section.items || section.items.length === 0) && !sectionSnapshot.isDraggingOver && (
                                    <p className="text-sm text-muted-foreground italic text-center py-4">
                                      No items in this section. Add files from the left panel.
                                    </p>
                                  )}
                                </div>
                              )}
                            </Droppable>
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
