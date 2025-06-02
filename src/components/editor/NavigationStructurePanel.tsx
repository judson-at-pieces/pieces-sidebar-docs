import { useState } from "react";
import { 
  Plus, 
  FileText, 
  FolderOpen,
  Trash2, 
  Edit2,
  ExternalLink,
  Folder,
  ChevronDown,
  ChevronRight,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  // Start with empty set so all items are collapsed by default
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    try {
      // First delete all items in the section
      const section = sections.find(s => s.id === sectionId);
      if (section?.items) {
        for (const item of section.items) {
          await navigationService.deleteNavigationItem(item.id);
        }
      }
      
      // Then delete the section itself
      const { error } = await navigationService.updateNavigationSection(sectionId, { is_active: false });
      if (error) throw error;
      
      onNavigationChange();
      toast.success(`Deleted section: ${sectionTitle}`);
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error("Failed to delete section");
    }
  };

  const handleRemoveItemFromDb = async (sectionId: string, itemId: string) => {
    try {
      // Delete from database if it's not a temporary item
      if (!itemId.startsWith('temp-')) {
        await navigationService.deleteNavigationItem(itemId);
      }
      
      // Trigger navigation refresh
      onNavigationChange();
      
      toast.success("Removed item from navigation");
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error("Failed to remove item from navigation");
    }
  };

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const buildHierarchy = (items: NavigationItem[]): NavigationItem[] => {
    const itemMap = new Map<string, NavigationItem>();
    const rootItems: NavigationItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, items: [] });
    });

    items.forEach(item => {
      const mappedItem = itemMap.get(item.id)!;
      
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id)!;
        if (!parent.items) parent.items = [];
        parent.items.push(mappedItem);
      } else {
        rootItems.push(mappedItem);
      }
    });

    const sortItems = (items: NavigationItem[]) => {
      items.sort((a, b) => a.order_index - b.order_index);
      items.forEach(item => {
        if (item.items && item.items.length > 0) {
          sortItems(item.items);
        }
      });
    };

    sortItems(rootItems);
    return rootItems;
  };

  const renderNavigationItems = (items: NavigationItem[], depth = 0, sectionId: string): React.ReactNode[] => {
    return items.map((item) => {
      const hasChildren = item.items && item.items.length > 0;
      const isExpanded = expandedItems.has(item.id);
      
      return (
        <div key={item.id} className="space-y-1">
          <div className={`p-3 border rounded-lg flex items-center justify-between transition-all hover:bg-accent/50 hover:border-primary/20 ${
            depth > 0 ? 'ml-4 border-l-2 border-l-primary/20' : ''
          }`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                  onClick={() => toggleItemExpansion(item.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              {hasChildren ? (
                <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              
              <span className="text-sm flex-1 truncate font-medium">{item.title}</span>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.is_auto_generated && (
                  <Badge variant="secondary" className="text-xs">Auto</Badge>
                )}
                
                {hasChildren && (
                  <Badge variant="outline" className="text-xs">
                    {item.items!.length}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.href && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(item.href, '_blank')}
                  className="h-7 w-7 p-0 hover:bg-primary/10"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveItemFromDb(sectionId, item.id)}
                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="space-y-1">
              {renderNavigationItems(item.items!, depth + 1, sectionId)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/50">
      <CardHeader className="pb-4 flex-shrink-0 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Navigation Structure
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setIsAddingSection(true)}
            disabled={isAddingSection}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
        
        {isAddingSection && (
          <div className="flex gap-2 mt-4 p-3 bg-muted/30 rounded-lg border">
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
              className="flex-1"
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
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full w-full">
          <div className="space-y-4 p-4">
            {sections.map((section) => {
              const hierarchicalItems = buildHierarchy(section.items || []);
              
              return (
                <div key={section.id} className="border rounded-lg overflow-hidden border-border/50">
                  <div className="p-4 border-b bg-muted/30 border-border/50">
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
                            className="flex-1"
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
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">{section.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {section.items?.length || 0} items
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSection(section.id);
                                setEditingSectionTitle(section.title);
                              }}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSection(section.id, section.title)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 min-h-[120px]">
                    {hierarchicalItems.length ? (
                      <div className="space-y-2">
                        {renderNavigationItems(hierarchicalItems, 0, section.id)}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground text-sm py-8 bg-muted/20 rounded-lg border-2 border-dashed border-border/30">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium mb-1">No items in this section</p>
                        <p className="text-xs">Use the + button next to files to add them here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {sections.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No sections yet</p>
                <p className="text-sm">Create your first section to organize your navigation</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
