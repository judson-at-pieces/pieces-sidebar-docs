
import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Plus, 
  GripVertical, 
  FileText, 
  FolderOpen,
  Trash2, 
  Edit2,
  ExternalLink,
  Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NavigationSection, NavigationItem } from "@/services/navigationService";
import { navigationService } from "@/services/navigationService";
import { toast } from "sonner";

interface NavigationStructurePanelProps {
  sections: NavigationSection[];
  onAddSection: (title: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onRemoveItem: (sectionId: string, itemIndex: number) => void;
  onNavigationChange: () => void;
}

export function NavigationStructurePanel({ 
  sections, 
  onAddSection, 
  onUpdateSectionTitle, 
  onRemoveItem,
  onNavigationChange
}: NavigationStructurePanelProps) {
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    onAddSection(newSectionTitle);
    setNewSectionTitle("");
    setIsAddingSection(false);
  };

  const handleUpdateSection = (sectionId: string) => {
    if (!editingSectionTitle.trim()) return;
    onUpdateSectionTitle(sectionId, editingSectionTitle);
    setEditingSection(null);
    setEditingSectionTitle("");
  };

  const handleRemoveItemFromDb = async (sectionId: string, itemIndex: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section?.items || !section.items[itemIndex]) {
      toast.error("Item not found");
      return;
    }

    const item = section.items[itemIndex];
    
    try {
      // Delete from database if it's not a temporary item
      if (!item.id.startsWith('temp-')) {
        await navigationService.deleteNavigationItem(item.id);
      }
      
      // Update local state
      onRemoveItem(sectionId, itemIndex);
      
      // Trigger navigation refresh
      onNavigationChange();
      
      toast.success(`Removed ${item.title} from navigation`);
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error("Failed to remove item from navigation");
    }
  };

  // Recursive function to render navigation items with proper nesting
  const renderNavigationItems = (items: NavigationItem[], depth = 0): React.ReactNode[] => {
    return items.map((item, itemIndex) => {
      const hasChildren = item.items && item.items.length > 0;
      
      return (
        <div key={`${item.id}-${itemIndex}`} className="space-y-1">
          <Draggable draggableId={`${item.id}-${itemIndex}`} index={itemIndex}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`p-2 border rounded flex items-center justify-between transition-colors ${
                  snapshot.isDragging ? 'bg-background shadow-lg' : 'hover:bg-accent/50'
                } ${depth > 0 ? 'ml-4 border-l-2 border-l-primary/20' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  {hasChildren ? (
                    <Folder className="h-3 w-3 text-blue-600" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  <span className="text-sm">{item.title}</span>
                  {item.is_auto_generated && (
                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                  )}
                  {hasChildren && (
                    <Badge variant="outline" className="text-xs">
                      {item.items!.length} items
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(item.href, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItemFromDb(sections.find(s => s.items?.includes(item))?.id || '', itemIndex)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </Draggable>
          
          {/* Render nested children */}
          {hasChildren && (
            <div className="space-y-1">
              {renderNavigationItems(item.items!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Flatten items for drag and drop while maintaining visual hierarchy
  const flattenItemsForDragDrop = (items: NavigationItem[]): NavigationItem[] => {
    const flattened: NavigationItem[] = [];
    
    const flatten = (itemList: NavigationItem[]) => {
      for (const item of itemList) {
        flattened.push(item);
        if (item.items && item.items.length > 0) {
          flatten(item.items);
        }
      }
    };
    
    flatten(items);
    return flattened;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Navigation Structure
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setIsAddingSection(true)}
            disabled={isAddingSection}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Section
          </Button>
        </div>
        
        {isAddingSection && (
          <div className="flex gap-2 mt-3">
            <Input
              placeholder="Section title..."
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSection();
                if (e.key === 'Escape') {
                  setIsAddingSection(false);
                  setNewSectionTitle("");
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleAddSection} disabled={!newSectionTitle.trim()}>
              Add
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsAddingSection(false);
                setNewSectionTitle("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <Droppable droppableId="sections" isDropDisabled={true}>
          {(provided) => (
            <ScrollArea className="h-full">
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {sections.map((section, sectionIndex) => (
                  <Draggable key={section.id} draggableId={section.id} index={sectionIndex}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-lg ${
                          snapshot.isDragging ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="p-3 border-b bg-muted/50" {...provided.dragHandleProps}>
                          <div className="flex items-center justify-between">
                            {editingSection === section.id ? (
                              <div className="flex gap-2 flex-1">
                                <Input
                                  value={editingSectionTitle}
                                  onChange={(e) => setEditingSectionTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateSection(section.id);
                                    if (e.key === 'Escape') {
                                      setEditingSection(null);
                                      setEditingSectionTitle("");
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => handleUpdateSection(section.id)}>
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    setEditingSection(null);
                                    setEditingSectionTitle("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{section.title}</span>
                                  <Badge variant="outline">{section.items?.length || 0} items</Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingSection(section.id);
                                    setEditingSectionTitle(section.title);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Droppable droppableId={`section-${section.id}`}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`p-3 min-h-[100px] transition-all duration-200 rounded-b-lg ${
                                snapshot.isDraggingOver 
                                  ? 'bg-primary/5 border-2 border-primary border-dashed' 
                                  : 'border-2 border-transparent'
                              }`}
                            >
                              {section.items?.length ? (
                                <div className="space-y-2">
                                  {renderNavigationItems(section.items)}
                                </div>
                              ) : (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                  Drop files or folders here to add them to this section
                                </div>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            </ScrollArea>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
}
