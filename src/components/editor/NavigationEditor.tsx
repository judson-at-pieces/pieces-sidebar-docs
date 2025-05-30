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

  // Create navigation items from folder structure - preserving complete hierarchy
  const createNavigationItemsFromFolder = (folderNode: FileNode, parentId?: string): NavigationItem[] => {
    const items: NavigationItem[] = [];
    
    // Check if this folder has an index file (e.g., cli.md for cli folder)
    const indexFileName = `${folderNode.name}.md`;
    const indexFile = folderNode.children?.find(child => 
      child.type === 'file' && child.name === indexFileName
    );
    
    // Create the folder item (which represents the folder container)
    const folderItem: NavigationItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      title: folderNode.name.replace(/-/g, ' '),
      // If there's an index file, use its path for the href, otherwise use folder path
      href: indexFile ? `/${indexFile.path.replace('.md', '')}` : `/${folderNode.path}`,
      file_path: indexFile?.path || folderNode.path,
      order_index: 0,
      parent_id: parentId,
      is_auto_generated: true,
      items: []
    };
    
    items.push(folderItem);
    
    // Process ALL children (files and subfolders)
    if (folderNode.children) {
      folderNode.children.forEach(child => {
        if (child.type === 'file' && !isFileUsed(child.path)) {
          const childItem: NavigationItem = {
            id: `temp-${Date.now()}-${Math.random()}`,
            title: child.name.replace('.md', '').replace(/-/g, ' '),
            href: `/${child.path.replace('.md', '')}`,
            file_path: child.path,
            order_index: 0,
            parent_id: folderItem.id,
            is_auto_generated: true
          };
          folderItem.items!.push(childItem);
        } else if (child.type === 'folder') {
          // Recursively process subfolders
          const subFolderItems = createNavigationItemsFromFolder(child, folderItem.id);
          folderItem.items!.push(...subFolderItems);
        }
      });
    }
    
    return items;
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
      
      // Handle both files and folders
      if (draggableId.startsWith('folder-')) {
        console.log('Processing folder drag:', draggableId);
        // Handle folder drag - preserve complete folder structure including all children
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
          return;
        }

        // Create complete navigation structure including all children
        const newItems = createNavigationItemsFromFolder(folder);
        console.log('Created navigation items:', newItems);
        console.log('First item children:', newItems[0]?.items);
        
        if (newItems.length === 0) {
          toast.info("No available files in this folder");
          return;
        }

        const updatedSections = sections.map(s => {
          if (s.id === destSectionId) {
            const allItems = [...(s.items || []), ...newItems];
            return { 
              ...s, 
              items: allItems.map((item, index) => ({ ...item, order_index: index }))
            };
          }
          return s;
        });
        
        setSections(updatedSections);
        onNavigationChange();
        
        // Count total items added (including children)
        const totalItemsAdded = newItems.reduce((count, item) => {
          return count + 1 + (item.items ? item.items.length : 0);
        }, 0);
        
        toast.success(`Added ${folder.name} folder with ${totalItemsAdded} items to navigation`);
        
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
          return;
        }
        
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
        toast.success(`Added ${file.name.replace('.md', '')} to navigation`);
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
          Drag files or entire folders from the "Available Files" section into navigation sections to organize your documentation. Folders will maintain their complete structure including index files and all children.
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
