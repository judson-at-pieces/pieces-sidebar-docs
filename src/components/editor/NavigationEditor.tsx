import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { navigationService, NavigationSection, NavigationItem } from "@/services/navigationService";
import { useNavigation } from "@/hooks/useNavigation";
import { FileNode } from "@/utils/fileSystem";
import { toast } from "sonner";
import { AvailableFilesPanel } from "./AvailableFilesPanel";
import { NavigationStructurePanel } from "./NavigationStructurePanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface NavigationEditorProps {
  fileStructure: FileNode[];
  onNavigationChange: () => void;
}

interface PendingChange {
  type: 'folder' | 'file';
  sectionId: string;
  folderNode?: FileNode;
  fileNode?: FileNode;
  previewItems: NavigationItem[];
}

export function NavigationEditor({ fileStructure, onNavigationChange }: NavigationEditorProps) {
  const { navigation, refetch } = useNavigation();
  const [sections, setSections] = useState<NavigationSection[]>([]);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (navigation?.sections) {
      setSections(navigation.sections);
    }
  }, [navigation]);

  // Check if a file is already used in navigation
  const isFileUsed = (filePath: string): boolean => {
    return sections.some(section => 
      section.items?.some(item => item.file_path === filePath)
    );
  };

  // Create navigation items from folder structure (preserving hierarchy)
  const createNavigationItemsFromFolder = (folderNode: FileNode, parentId?: string): NavigationItem[] => {
    console.log(`Creating navigation items for folder: ${folderNode.name} with children:`, folderNode.children);
    
    // Check if this folder has an index file
    const indexFileName = `${folderNode.name}.md`;
    const indexFile = folderNode.children?.find(child => 
      child.type === 'file' && child.name === indexFileName
    );
    
    // Create the main folder item
    const folderId = `temp-${Date.now()}-${Math.random()}`;
    const folderItem: NavigationItem = {
      id: folderId,
      title: folderNode.name.replace(/-/g, ' '),
      href: indexFile ? `/${indexFile.path.replace('.md', '')}` : `/${folderNode.path}`,
      file_path: indexFile?.path || folderNode.path,
      order_index: 0,
      parent_id: parentId,
      is_auto_generated: true,
      items: []
    };

    // Process children and maintain hierarchy
    if (folderNode.children) {
      let childOrder = 0;
      
      for (const child of folderNode.children) {
        if (child.type === 'file' && !isFileUsed(child.path)) {
          // Skip the index file since it's already represented by the folder itself
          if (child.name !== indexFileName) {
            const childItem: NavigationItem = {
              id: `temp-${Date.now()}-${Math.random()}`,
              title: child.name.replace('.md', '').replace(/-/g, ' '),
              href: `/${child.path.replace('.md', '')}`,
              file_path: child.path,
              order_index: childOrder++,
              parent_id: folderId,
              is_auto_generated: true
            };
            
            folderItem.items!.push(childItem);
          }
        } else if (child.type === 'folder') {
          // Recursively process subfolders - keep them as nested children
          const subFolderItems = createNavigationItemsFromFolder(child, folderId);
          console.log(`Created subfolder item: ${child.name} with children count: ${subFolderItems[0]?.items?.length || 0}`);
          
          // Add the subfolder as a child of the current folder
          if (subFolderItems.length > 0) {
            const subFolder = subFolderItems[0];
            subFolder.order_index = childOrder++;
            subFolder.parent_id = folderId;
            folderItem.items!.push(subFolder);
          }
        }
      }
    }
    
    console.log(`Final folder item: ${folderNode.name} with children count: ${folderItem.items?.length || 0}`);
    return [folderItem];
  };

  // Save pending changes to database
  const savePendingChanges = async () => {
    if (!pendingChange) return;

    try {
      if (pendingChange.type === 'folder' && pendingChange.folderNode) {
        console.log('Starting to save folder structure to database...');
        const addedItems = await addFolderStructureToDb(pendingChange.folderNode, pendingChange.sectionId);
        console.log(`Successfully saved ${addedItems.length} items to database`);
        toast.success(`Added ${pendingChange.folderNode.name} folder with ${addedItems.length} items to navigation`);
      } else if (pendingChange.type === 'file' && pendingChange.fileNode) {
        const newItemData: Omit<NavigationItem, 'id'> = {
          title: pendingChange.fileNode.name.replace('.md', '').replace(/-/g, ' '),
          href: `/${pendingChange.fileNode.path.replace('.md', '')}`,
          file_path: pendingChange.fileNode.path,
          order_index: 0,
          parent_id: undefined,
          is_auto_generated: true
        };
        
        await addNavigationItemToDb(newItemData, pendingChange.sectionId);
        toast.success(`Added ${pendingChange.fileNode.name.replace('.md', '')} to navigation`);
      }
      
      // Force refresh the navigation data and local state
      console.log('Refreshing navigation data...');
      const refreshedNavigation = await refetch();
      console.log('Navigation refreshed:', refreshedNavigation);
      
      if (refreshedNavigation.data?.sections) {
        setSections(refreshedNavigation.data.sections);
      }
      
      onNavigationChange();
      setPendingChange(null);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error("Failed to save changes to navigation");
    }
  };

  // Add a single navigation item to the database
  const addNavigationItemToDb = async (item: Omit<NavigationItem, 'id'>, sectionId: string): Promise<NavigationItem> => {
    try {
      console.log('Adding item to DB:', { 
        title: item.title, 
        parent_id: item.parent_id,
        section_id: sectionId 
      });
      
      const dbItem = await navigationService.addNavigationItem({
        section_id: sectionId,
        parent_id: item.parent_id,
        title: item.title,
        href: item.href,
        description: item.description,
        icon: item.icon,
        order_index: item.order_index,
        is_auto_generated: item.is_auto_generated,
        file_path: item.file_path
      });
      
      console.log('Item added to DB:', { id: dbItem.id, title: dbItem.title, parent_id: dbItem.parent_id });
      return dbItem;
    } catch (error) {
      console.error('Error adding navigation item:', error);
      throw error;
    }
  };

  // Recursively add folder structure to database while preserving hierarchy
  const addFolderStructureToDb = async (folderNode: FileNode, sectionId: string, parentDbId?: string): Promise<NavigationItem[]> => {
    const addedItems: NavigationItem[] = [];
    
    console.log(`Processing folder: ${folderNode.name}, parent_id: ${parentDbId}`);
    
    // Check if this folder has an index file
    const indexFileName = `${folderNode.name}.md`;
    const indexFile = folderNode.children?.find(child => 
      child.type === 'file' && child.name === indexFileName
    );
    
    // Create the main folder item first
    const folderItemData: Omit<NavigationItem, 'id'> = {
      title: folderNode.name.replace(/-/g, ' '),
      href: indexFile ? `/${indexFile.path.replace('.md', '')}` : `/${folderNode.path}`,
      file_path: indexFile?.path || folderNode.path,
      order_index: 0,
      parent_id: parentDbId,
      is_auto_generated: true
    };

    console.log(`Creating folder in DB: ${folderNode.name}, parent_id: ${parentDbId}`);
    const folderItem = await addNavigationItemToDb(folderItemData, sectionId);
    addedItems.push(folderItem);
    console.log(`Folder created in DB: ${folderNode.name}, DB ID: ${folderItem.id}`);

    // Process children in order - files first, then subfolders
    if (folderNode.children) {
      let childOrder = 0;
      
      // First, add all files (except index file)
      for (const child of folderNode.children) {
        if (child.type === 'file' && !isFileUsed(child.path) && child.name !== indexFileName) {
          const childItemData: Omit<NavigationItem, 'id'> = {
            title: child.name.replace('.md', '').replace(/-/g, ' '),
            href: `/${child.path.replace('.md', '')}`,
            file_path: child.path,
            order_index: childOrder++,
            parent_id: folderItem.id, // Use the actual DB ID from the saved folder
            is_auto_generated: true
          };
          
          console.log(`Adding file to DB: ${child.name}, parent_id: ${folderItem.id}`);
          const childItem = await addNavigationItemToDb(childItemData, sectionId);
          addedItems.push(childItem);
          console.log(`File added to DB: ${child.name}, DB ID: ${childItem.id}`);
        }
      }
      
      // Then, recursively process subfolders
      for (const child of folderNode.children) {
        if (child.type === 'folder') {
          console.log(`Processing subfolder: ${child.name}, parent will be: ${folderItem.id}`);
          const subFolderItems = await addFolderStructureToDb(child, sectionId, folderItem.id);
          addedItems.push(...subFolderItems);
          childOrder++;
        }
      }
    }
    
    console.log(`Completed processing folder: ${folderNode.name}, total items added: ${addedItems.length}`);
    return addedItems;
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    // Handle dragging from available files to navigation sections
    if (source.droppableId === 'available-files' && destination.droppableId.startsWith('section-')) {
      const destSectionId = destination.droppableId.replace('section-', '');
      
      try {
        // Handle both files and folders
        if (draggableId.startsWith('folder-')) {
          // Handle folder drag
          const folderPath = draggableId.replace('folder-', '');
          const findFolderByPath = (nodes: FileNode[], path: string): FileNode | null => {
            for (const node of nodes) {
              if (node.path === path && node.type === 'folder') {
                return node;
              }
              if (node.children) {
                const found = findFolderByPath(node.children, path);
                if (found) return found;
              }
            }
            return null;
          };

          const folder = findFolderByPath(fileStructure, folderPath);
          
          if (!folder) {
            toast.error("Folder not found");
            return;
          }

          console.log(`Processing folder drag: ${draggableId}`);
          console.log('Found folder:', folder);

          // Create preview items maintaining hierarchy
          const previewItems = createNavigationItemsFromFolder(folder);
          console.log('Created navigation items:', previewItems);
          console.log('Main folder item:', previewItems[0]);
          console.log('Main folder children:', previewItems[0]?.items);
          
          if (previewItems.length === 0) {
            toast.info("No available files in this folder");
            return;
          }

          // Set up pending change for confirmation
          setPendingChange({
            type: 'folder',
            sectionId: destSectionId,
            folderNode: folder,
            previewItems
          });
          setShowConfirmDialog(true);
          
        } else {
          // Handle single file drag
          const findFileByPath = (nodes: FileNode[], path: string): FileNode | null => {
            for (const node of nodes) {
              if (node.path === path && node.type === 'file') {
                return node;
              }
              if (node.children) {
                const found = findFileByPath(node.children, path);
                if (found) return found;
              }
            }
            return null;
          };

          const file = findFileByPath(fileStructure, draggableId);
          
          if (!file) {
            toast.error("File not found");
            return;
          }
          
          const previewItem: NavigationItem = {
            id: `temp-${Date.now()}-${Math.random()}`,
            title: file.name.replace('.md', '').replace(/-/g, ' '),
            href: `/${file.path.replace('.md', '')}`,
            file_path: file.path,
            order_index: destination.index,
            parent_id: undefined,
            is_auto_generated: true
          };
          
          // Set up pending change for confirmation
          setPendingChange({
            type: 'file',
            sectionId: destSectionId,
            fileNode: file,
            previewItems: [previewItem]
          });
          setShowConfirmDialog(true);
        }
      } catch (error) {
        console.error('Error processing drag:', error);
        toast.error("Failed to process drag operation");
      }
      return;
    }

    // Handle section reordering
    if (source.droppableId === 'sections' && destination.droppableId === 'sections') {
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order_index: index
      }));
      
      setSections(updatedSections);
      onNavigationChange();
      return;
    }

    // Handle item reordering within sections or moving between sections
    if (source.droppableId.startsWith('section-') && destination.droppableId.startsWith('section-')) {
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
        destItems.splice(destination.index, 0, movedItem);
        
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
  };

  const handleAddSection = async (title: string) => {
    try {
      const newSection = await navigationService.addNavigationSection({
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        order_index: sections.length
      });
      
      // Refresh navigation data instead of manually updating state
      await refetch();
      onNavigationChange();
      toast.success(`Added section: ${title}`);
    } catch (error) {
      toast.error("Failed to add section");
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string, title: string) => {
    try {
      await navigationService.updateNavigationSection(sectionId, {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-')
      });
      
      // Refresh navigation data instead of manually updating state
      await refetch();
      onNavigationChange();
      toast.success("Section updated");
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  const handleRemoveItem = (sectionId: string, itemIndex: number) => {
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
  };

  const renderPreviewItems = (items: NavigationItem[], depth = 0): React.ReactNode => {
    return items.map((item, index) => (
      <div key={item.id} className={`py-1 ${depth > 0 ? 'ml-4 border-l pl-2' : ''}`}>
        <div className="text-sm font-medium">{item.title}</div>
        <div className="text-xs text-muted-foreground">{item.href}</div>
        {item.items && item.items.length > 0 && (
          <div className="mt-1">
            {renderPreviewItems(item.items, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Navigation Editor</h2>
        <p className="text-sm text-muted-foreground">
          Drag files or entire folders from the "Available Files" section into navigation sections to organize your documentation. 
          You'll be asked to confirm before changes are saved to the database.
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-4 h-full p-4">
            <AvailableFilesPanel 
              fileStructure={fileStructure}
              isFileUsed={isFileUsed}
            />
            <NavigationStructurePanel
              sections={sections}
              onAddSection={handleAddSection}
              onUpdateSectionTitle={handleUpdateSectionTitle}
              onRemoveItem={handleRemoveItem}
              onNavigationChange={async () => {
                console.log('Navigation change requested, refreshing...');
                const refreshedNavigation = await refetch();
                if (refreshedNavigation.data?.sections) {
                  setSections(refreshedNavigation.data.sections);
                }
                onNavigationChange();
              }}
            />
          </div>
        </DragDropContext>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Confirm Navigation Changes
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You're about to add the following items to the navigation:
            </p>
            
            <div className="border rounded-lg p-4 bg-muted/50 max-h-60 overflow-y-auto">
              {pendingChange && renderPreviewItems(pendingChange.previewItems)}
            </div>
            
            <p className="text-xs text-muted-foreground">
              This will {pendingChange?.type === 'folder' ? 'preserve the folder structure' : 'add the file'} to your navigation.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPendingChange(null);
                setShowConfirmDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={savePendingChanges}>
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
