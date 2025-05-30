
import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { navigationService, NavigationSection, NavigationItem } from "@/services/navigationService";
import { useNavigation } from "@/hooks/useNavigation";
import { FileNode } from "@/utils/fileSystem";
import { toast } from "sonner";
import { AvailableFilesPanel } from "./AvailableFilesPanel";
import { NavigationStructurePanel } from "./NavigationStructurePanel";

interface NavigationEditorProps {
  fileStructure: FileNode[];
  onNavigationChange: () => void;
}

export function NavigationEditor({ fileStructure, onNavigationChange }: NavigationEditorProps) {
  const { navigation } = useNavigation();
  const [sections, setSections] = useState<NavigationSection[]>([]);

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

  // Add a single navigation item to the database
  const addNavigationItemToDb = async (item: Omit<NavigationItem, 'id'>, sectionId: string): Promise<NavigationItem> => {
    try {
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
      return dbItem;
    } catch (error) {
      console.error('Error adding navigation item:', error);
      throw error;
    }
  };

  // Recursively add folder structure to database
  const addFolderStructureToDb = async (folderNode: FileNode, sectionId: string, parentId?: string): Promise<NavigationItem[]> => {
    const addedItems: NavigationItem[] = [];
    
    // Check if this folder has an index file
    const indexFileName = `${folderNode.name}.md`;
    const indexFile = folderNode.children?.find(child => 
      child.type === 'file' && child.name === indexFileName
    );
    
    // Create the main folder item
    const folderItemData: Omit<NavigationItem, 'id'> = {
      title: folderNode.name.replace(/-/g, ' '),
      href: indexFile ? `/${indexFile.path.replace('.md', '')}` : `/${folderNode.path}`,
      file_path: indexFile?.path || folderNode.path,
      order_index: 0,
      parent_id: parentId,
      is_auto_generated: true
    };

    console.log('Adding folder to database:', folderItemData.title);
    const folderItem = await addNavigationItemToDb(folderItemData, sectionId);
    addedItems.push(folderItem);

    // Process children
    if (folderNode.children) {
      let childOrder = 0;
      
      for (const child of folderNode.children) {
        if (child.type === 'file' && !isFileUsed(child.path)) {
          // Skip the index file since it's already represented by the folder itself
          if (child.name !== indexFileName) {
            const childItemData: Omit<NavigationItem, 'id'> = {
              title: child.name.replace('.md', '').replace(/-/g, ' '),
              href: `/${child.path.replace('.md', '')}`,
              file_path: child.path,
              order_index: childOrder++,
              parent_id: folderItem.id,
              is_auto_generated: true
            };
            
            console.log('Adding file to database:', childItemData.title);
            const childItem = await addNavigationItemToDb(childItemData, sectionId);
            addedItems.push(childItem);
          }
        } else if (child.type === 'folder') {
          // Recursively process subfolders
          console.log('Processing subfolder:', child.name);
          const subFolderItems = await addFolderStructureToDb(child, sectionId, folderItem.id);
          addedItems.push(...subFolderItems);
        }
      }
    }
    
    return addedItems;
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    console.log('Drag ended:', { destination, source, draggableId });

    if (!destination) {
      console.log('No destination, drag cancelled');
      return;
    }

    // Handle dragging from available files to navigation sections
    if (source.droppableId === 'available-files' && destination.droppableId.startsWith('section-')) {
      const destSectionId = destination.droppableId.replace('section-', '');
      console.log('Dragging from available files to section:', destSectionId);
      
      try {
        // Handle both files and folders
        if (draggableId.startsWith('folder-')) {
          console.log('Processing folder drag:', draggableId);
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
          console.log('Found folder:', folder);
          
          if (!folder) {
            console.error('Folder not found for path:', folderPath);
            toast.error("Folder not found");
            return;
          }

          // Add the complete folder structure to the database
          console.log('Adding folder structure to database...');
          const addedItems = await addFolderStructureToDb(folder, destSectionId);
          
          if (addedItems.length === 0) {
            toast.info("No available files in this folder");
            return;
          }

          console.log('Successfully added items to database:', addedItems.length);
          
          // Refresh navigation data
          onNavigationChange();
          
          toast.success(`Added ${folder.name} folder with ${addedItems.length} items to navigation`);
          
        } else {
          console.log('Processing file drag:', draggableId);
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
            console.error('File not found for path:', draggableId);
            toast.error("File not found");
            return;
          }
          
          const newItemData: Omit<NavigationItem, 'id'> = {
            title: file.name.replace('.md', '').replace(/-/g, ' '),
            href: `/${file.path.replace('.md', '')}`,
            file_path: file.path,
            order_index: destination.index,
            parent_id: undefined,
            is_auto_generated: true
          };
          
          console.log('Adding file to database:', newItemData.title);
          await addNavigationItemToDb(newItemData, destSectionId);
          
          onNavigationChange();
          toast.success(`Added ${file.name.replace('.md', '')} to navigation`);
        }
      } catch (error) {
        console.error('Error adding items to navigation:', error);
        toast.error("Failed to add items to navigation");
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
      
      setSections([...sections, { ...newSection, items: [] }]);
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
      
      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, title, slug: title.toLowerCase().replace(/\s+/g, '-') }
          : s
      ));
      
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
    onNavigationChange();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Navigation Editor</h2>
        <p className="text-sm text-muted-foreground">
          Drag files or entire folders from the "Available Files" section into navigation sections to organize your documentation. 
          Folder structures will be preserved and saved to the database.
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
            />
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
