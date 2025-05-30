
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult
} from "@hello-pangea/dnd";
import { 
  Plus, 
  GripVertical, 
  FileText, 
  FolderOpen, 
  Trash2, 
  Edit2,
  ExternalLink
} from "lucide-react";
import { navigationService, NavigationSection, NavigationItem } from "@/services/navigationService";
import { useNavigation } from "@/hooks/useNavigation";
import { FileNode } from "@/utils/fileSystem";
import { toast } from "sonner";

interface NavigationEditorProps {
  fileStructure: FileNode[];
  onNavigationChange: () => void;
}

export function NavigationEditor({ fileStructure, onNavigationChange }: NavigationEditorProps) {
  const { navigation, refetch } = useNavigation();
  const [sections, setSections] = useState<NavigationSection[]>([]);
  const [availableFiles, setAvailableFiles] = useState<FileNode[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

  useEffect(() => {
    if (navigation?.sections) {
      setSections(navigation.sections);
    }
  }, [navigation]);

  useEffect(() => {
    // Flatten file structure to get all markdown files
    const flattenFiles = (nodes: FileNode[]): FileNode[] => {
      const files: FileNode[] = [];
      nodes.forEach(node => {
        if (node.type === 'file' && node.name.endsWith('.md')) {
          files.push(node);
        } else if (node.type === 'folder' && node.children) {
          files.push(...flattenFiles(node.children));
        }
      });
      return files;
    };

    const allFiles = flattenFiles(fileStructure);
    
    // Filter out files that are already in navigation
    const usedFilePaths = new Set<string>();
    sections.forEach(section => {
      section.items?.forEach(item => {
        if (item.file_path) {
          usedFilePaths.add(item.file_path);
        }
      });
    });

    const unused = allFiles.filter(file => !usedFilePaths.has(file.path));
    setAvailableFiles(unused);
  }, [fileStructure, sections]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === 'section') {
      // Reorder sections
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      // Update order_index for all sections
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order_index: index
      }));
      
      setSections(updatedSections);
      onNavigationChange();
      return;
    }

    if (type === 'item') {
      // Handle item reordering within sections or moving between sections
      const sourceSectionId = source.droppableId.replace('section-', '');
      const destSectionId = destination.droppableId.replace('section-', '');
      
      if (sourceSectionId === destSectionId) {
        // Reorder within same section
        const section = sections.find(s => s.id === sourceSectionId);
        if (!section || !section.items) return;
        
        const newItems = Array.from(section.items);
        const [reorderedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, reorderedItem);
        
        const updatedSections = sections.map(s =>
          s.id === sourceSectionId
            ? { ...s, items: newItems.map((item, index) => ({ ...item, order_index: index })) }
            : s
        );
        
        setSections(updatedSections);
        onNavigationChange();
      } else {
        // Move between sections
        const sourceSection = sections.find(s => s.id === sourceSectionId);
        const destSection = sections.find(s => s.id === destSectionId);
        
        if (!sourceSection?.items || !destSection) return;
        
        const [movedItem] = sourceSection.items.splice(source.index, 1);
        const destItems = destSection.items || [];
        destItems.splice(destination.index, 0, { ...movedItem, section_id: destSectionId });
        
        const updatedSections = sections.map(s => {
          if (s.id === sourceSectionId) {
            return { ...s, items: sourceSection.items?.map((item, index) => ({ ...item, order_index: index })) || [] };
          }
          if (s.id === destSectionId) {
            return { ...s, items: destItems.map((item, index) => ({ ...item, order_index: index })) };
          }
          return s;
        });
        
        setSections(updatedSections);
        onNavigationChange();
      }
    }

    if (source.droppableId === 'available-files') {
      // Drag from available files to a section
      const destSectionId = destination.droppableId.replace('section-', '');
      const file = availableFiles.find(f => f.path === draggableId);
      
      if (!file) return;
      
      const newItem: NavigationItem = {
        id: `temp-${Date.now()}`,
        title: file.name.replace('.md', '').replace(/-/g, ' '),
        href: `/${file.path.replace('.md', '')}`,
        file_path: file.path,
        order_index: destination.index,
        parent_id: undefined,
        is_auto_generated: true
      };
      
      const updatedSections = sections.map(s => {
        if (s.id === destSectionId) {
          const newItems = [...(s.items || [])];
          newItems.splice(destination.index, 0, newItem);
          return { 
            ...s, 
            items: newItems.map((item, index) => ({ ...item, order_index: index }))
          };
        }
        return s;
      });
      
      setSections(updatedSections);
      onNavigationChange();
    }
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    
    try {
      const newSection = await navigationService.addNavigationSection({
        title: newSectionTitle,
        slug: newSectionTitle.toLowerCase().replace(/\s+/g, '-'),
        order_index: sections.length
      });
      
      setSections([...sections, { ...newSection, items: [] }]);
      setNewSectionTitle("");
      setIsAddingSection(false);
      onNavigationChange();
      toast.success(`Added section: ${newSectionTitle}`);
    } catch (error) {
      toast.error("Failed to add section");
    }
  };

  const updateSectionTitle = async (sectionId: string) => {
    if (!editingSectionTitle.trim()) return;
    
    try {
      await navigationService.updateNavigationSection(sectionId, {
        title: editingSectionTitle,
        slug: editingSectionTitle.toLowerCase().replace(/\s+/g, '-')
      });
      
      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, title: editingSectionTitle, slug: editingSectionTitle.toLowerCase().replace(/\s+/g, '-') }
          : s
      ));
      
      setEditingSection(null);
      setEditingSectionTitle("");
      onNavigationChange();
      toast.success("Section updated");
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  const removeItemFromNavigation = (sectionId: string, itemIndex: number) => {
    const updatedSections = sections.map(s => {
      if (s.id === sectionId && s.items) {
        const newItems = [...s.items];
        newItems.splice(itemIndex, 1);
        return { 
          ...s, 
          items: newItems.map((item, index) => ({ ...item, order_index: index }))
        };
      }
      return s;
    });
    
    setSections(updatedSections);
    onNavigationChange();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Navigation Editor</h2>
        <p className="text-sm text-muted-foreground">
          Drag files from the "Available Files" section into navigation sections to organize your documentation.
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Available Files */}
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Available Files
                  <Badge variant="secondary">{availableFiles.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <Droppable droppableId="available-files" type="file">
                  {(provided) => (
                    <ScrollArea className="h-full">
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {availableFiles.map((file, index) => (
                          <Draggable key={file.path} draggableId={file.path} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 border rounded-lg flex items-center gap-2 cursor-move transition-colors ${
                                  snapshot.isDragging ? 'bg-accent' : 'hover:bg-accent/50'
                                }`}
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <FileText className="h-4 w-4" />
                                <span className="text-sm font-medium truncate">
                                  {file.name.replace('.md', '')}
                                </span>
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

            {/* Navigation Structure */}
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
                        if (e.key === 'Enter') addSection();
                        if (e.key === 'Escape') {
                          setIsAddingSection(false);
                          setNewSectionTitle("");
                        }
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={addSection} disabled={!newSectionTitle.trim()}>
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
                <Droppable droppableId="sections" type="section">
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
                                            if (e.key === 'Enter') updateSectionTitle(section.id);
                                            if (e.key === 'Escape') {
                                              setEditingSection(null);
                                              setEditingSectionTitle("");
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <Button size="sm" onClick={() => updateSectionTitle(section.id)}>
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
                                
                                <Droppable droppableId={`section-${section.id}`} type="item">
                                  {(provided, snapshot) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className={`p-3 min-h-[60px] ${
                                        snapshot.isDraggingOver ? 'bg-accent/50' : ''
                                      }`}
                                    >
                                      {section.items?.length ? (
                                        <div className="space-y-2">
                                          {section.items.map((item, itemIndex) => (
                                            <Draggable key={`${item.id}-${itemIndex}`} draggableId={`${item.id}-${itemIndex}`} index={itemIndex}>
                                              {(provided, snapshot) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  className={`p-2 border rounded flex items-center justify-between ${
                                                    snapshot.isDragging ? 'bg-background' : 'hover:bg-accent/50'
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                                                    <FileText className="h-3 w-3" />
                                                    <span className="text-sm">{item.title}</span>
                                                    {item.is_auto_generated && (
                                                      <Badge variant="secondary" className="text-xs">Auto</Badge>
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
                                                      onClick={() => removeItemFromNavigation(section.id, itemIndex)}
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}
                                            </Draggable>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center text-muted-foreground text-sm py-4">
                                          Drop files here to add them to this section
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
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
