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

  // Helper function to find an item by ID in nested structure
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

  // Helper function to get all items with their hierarchical paths
  const getAllItemsWithPaths = (items: any[], parentPath: number[] = []): Array<{item: any, path: number[]}> => {
    const result: Array<{item: any, path: number[]}> = [];
    
    items.forEach((item, index) => {
      const currentPath = [...parentPath, index];
      result.push({ item, path: currentPath });
      
      if (item.items && item.items.length > 0) {
        result.push(...getAllItemsWithPaths(item.items, currentPath));
      }
    });
    
    return result;
  };

  // Helper function to update nested items
  const updateNestedItems = (items: any[], path: number[], newItem: any): any[] => {
    if (path.length === 1) {
      const newItems = [...items];
      newItems[path[0]] = newItem;
      return newItems;
    }
    
    const newItems = [...items];
    const [currentIndex, ...restPath] = path;
    newItems[currentIndex] = {
      ...newItems[currentIndex],
      items: updateNestedItems(newItems[currentIndex].items || [], restPath, newItem)
    };
    return newItems;
  };

  // Helper function to remove item from nested structure
  const removeFromNested = (items: any[], path: number[]): any[] => {
    if (path.length === 1) {
      const newItems = [...items];
      newItems.splice(path[0], 1);
      return newItems;
    }
    
    const newItems = [...items];
    const [currentIndex, ...restPath] = path;
    newItems[currentIndex] = {
      ...newItems[currentIndex],
      items: removeFromNested(newItems[currentIndex].items || [], restPath)
    };
    return newItems;
  };

  // Helper function to insert item into nested structure
  const insertIntoNested = (items: any[], path: number[], item: any): any[] => {
    if (path.length === 1) {
      const newItems = [...items];
      newItems.splice(path[0], 0, item);
      return newItems;
    }
    
    const newItems = [...items];
    const [currentIndex, ...restPath] = path;
    if (!newItems[currentIndex]) {
      return newItems;
    }
    newItems[currentIndex] = {
      ...newItems[currentIndex],
      items: insertIntoNested(newItems[currentIndex].items || [], restPath, item)
    };
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
      
      try {
        const sourceSection = sections.find(s => s.id === sourceSectionId);
        const destSection = sections.find(s => s.id === destSectionId);
        
        if (!sourceSection?.items || !destSection) return;
        
        // Get all items with their hierarchical paths for both sections
        const sourceItemsWithPaths = getAllItemsWithPaths(sourceSection.items);
        const destItemsWithPaths = getAllItemsWithPaths(destSection.items);
        
        // Find the item being dragged
        const draggedItemData = sourceItemsWithPaths[source.index];
        if (!draggedItemData) return;
        
        const draggedItem = draggedItemData.item;
        
        console.log('Dragging item:', {
          itemId: draggedItem.id,
          title: draggedItem.title,
          from: { sectionId: sourceSectionId, index: source.index },
          to: { sectionId: destSectionId, index: destination.index }
        });

        if (sourceSectionId === destSectionId) {
          // Reordering within the same section
          let newItems = [...sourceSection.items];
          
          // Remove the item from its current position
          newItems = removeFromNested(newItems, draggedItemData.path);
          
          // Recalculate paths after removal
          const updatedItemsWithPaths = getAllItemsWithPaths(newItems);
          
          // Find the target position
          let targetPath: number[];
          if (destination.index === 0) {
            targetPath = [0];
          } else if (destination.index >= updatedItemsWithPaths.length) {
            targetPath = [updatedItemsWithPaths.length];
          } else {
            // Adjust for the new flat structure
            const adjustedIndex = destination.index > source.index ? destination.index - 1 : destination.index;
            if (updatedItemsWithPaths[adjustedIndex]) {
              targetPath = [...updatedItemsWithPaths[adjustedIndex].path];
              targetPath[targetPath.length - 1]++;
            } else {
              targetPath = [updatedItemsWithPaths.length];
            }
          }
          
          // Insert at the new position
          newItems = insertIntoNested(newItems, targetPath, draggedItem);
          
          // Update order indices recursively
          const updateOrderIndices = (items: any[]): any[] => {
            return items.map((item, index) => ({
              ...item,
              order_index: index,
              items: item.items ? updateOrderIndices(item.items) : []
            }));
          };
          
          newItems = updateOrderIndices(newItems);
          
          // Update the database for all affected items
          const updatePromises: Promise<any>[] = [];
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
          
          const allItems = flattenForUpdate(newItems);
          allItems.forEach(item => {
            updatePromises.push(
              navigationService.updateNavigationItem(item.id, {
                order_index: item.order_index
              })
            );
          });
          
          await Promise.all(updatePromises);
        } else {
          // Moving between different sections - simplified approach
          await navigationService.updateNavigationItem(draggedItem.id, {
            order_index: destination.index
          });
        }
        
        // Refresh navigation data to update UI
        onNavigationChange();
        
      } catch (error) {
        console.error('Error reordering items:', error);
        toast.error("Failed to reorder items");
        // Refresh to restore original state
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
