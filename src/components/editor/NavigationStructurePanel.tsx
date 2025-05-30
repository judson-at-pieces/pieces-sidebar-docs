
import { useState } from "react";
import { 
  Plus, 
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

  const handleRemoveItemFromDb = async (sectionId: string, itemId: string, parentItems?: NavigationItem[]) => {
    try {
      // Find the item in the section
      const section = sections.find(s => s.id === sectionId);
      if (!section?.items) {
        toast.error("Section not found");
        return;
      }

      // Find item recursively
      const findItemRecursive = (items: NavigationItem[], targetId: string): NavigationItem | null => {
        for (const item of items) {
          if (item.id === targetId) return item;
          if (item.items) {
            const found = findItemRecursive(item.items, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const item = findItemRecursive(section.items, itemId);
      if (!item) {
        toast.error("Item not found");
        return;
      }

      // Delete from database if it's not a temporary item
      if (!item.id.startsWith('temp-')) {
        await navigationService.deleteNavigationItem(item.id);
      }
      
      // Trigger navigation refresh
      onNavigationChange();
      
      toast.success(`Removed ${item.title} from navigation`);
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error("Failed to remove item from navigation");
    }
  };

  // Recursive function to render navigation items with proper nesting
  const renderNavigationItems = (items: NavigationItem[], depth = 0, sectionId: string): React.ReactNode[] => {
    return items.map((item, itemIndex) => {
      const hasChildren = item.items && item.items.length > 0;
      
      return (
        <div key={`${item.id}-${itemIndex}`} className="space-y-1">
          <div
            className={`p-2 border rounded flex items-center justify-between transition-colors hover:bg-accent/50 ${
              depth > 0 ? 'ml-4 border-l-2 border-l-primary/20' : ''
            }`}
          >
            <div className="flex items-center gap-2">
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
                onClick={() => handleRemoveItemFromDb(sectionId, item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Render nested children */}
          {hasChildren && (
            <div className="space-y-1">
              {renderNavigationItems(item.items!, depth + 1, sectionId)}
            </div>
          )}
        </div>
      );
    });
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
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="border rounded-lg">
                <div className="p-3 border-b bg-muted/50">
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
                
                <div className="p-3 min-h-[100px]">
                  {section.items?.length ? (
                    <div className="space-y-2">
                      {renderNavigationItems(section.items, 0, section.id)}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No items in this section yet. Use the + button next to files to add them here.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
