import { DropResult } from "@hello-pangea/dnd";
import { NavigationSection, NavigationItem } from "@/services/navigationService";
import { FileNode } from "@/utils/fileSystem";
import { toast } from "sonner";

interface PendingChange {
  type: 'folder' | 'file';
  sectionId: string;
  folderNode?: FileNode;
  fileNode?: FileNode;
  previewItems: NavigationItem[];
}

export function useDragAndDrop(
  fileStructure: FileNode[],
  sections: NavigationSection[],
  setSections: (sections: NavigationSection[]) => void,
  setPendingChange: (change: PendingChange | null) => void,
  setShowConfirmDialog: (show: boolean) => void,
  onNavigationChange: () => void
) {
  // Create navigation items from folder structure with proper hierarchy
  const createNavigationItemsFromFolder = (folderNode: FileNode, parentId?: string): NavigationItem[] => {
    const indexFileName = `${folderNode.name}.md`;
    const indexFile = folderNode.children?.find(child => 
      child.type === 'file' && child.name === indexFileName
    );
    
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

    if (folderNode.children) {
      let childOrder = 0;
      
      // Add files first (except index file)
      for (const child of folderNode.children) {
        if (child.type === 'file' && child.name !== indexFileName) {
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
      }
      
      // Add subfolders
      for (const child of folderNode.children) {
        if (child.type === 'folder') {
          const subFolderItems = createNavigationItemsFromFolder(child, folderId);
          if (subFolderItems.length > 0) {
            const subFolder = subFolderItems[0];
            subFolder.order_index = childOrder++;
            subFolder.parent_id = folderId;
            folderItem.items!.push(subFolder);
          }
        }
      }
    }
    
    return [folderItem];
  };

  const findNodeByPath = (nodes: FileNode[], path: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Handle dragging from available files to navigation sections
    if (source.droppableId === 'available-files' && destination.droppableId.startsWith('section-')) {
      const destSectionId = destination.droppableId.replace('section-', '');
      
      try {
        if (draggableId.startsWith('folder-')) {
          // Handle folder drag
          const folderPath = draggableId.replace('folder-', '');
          const folder = findNodeByPath(fileStructure, folderPath);
          
          if (!folder) {
            toast.error("Folder not found");
            return;
          }

          const previewItems = createNavigationItemsFromFolder(folder);
          
          if (previewItems.length === 0) {
            toast.info("No available files in this folder");
            return;
          }

          setPendingChange({
            type: 'folder',
            sectionId: destSectionId,
            folderNode: folder,
            previewItems
          });
          setShowConfirmDialog(true);
          
        } else {
          // Handle single file drag
          const file = findNodeByPath(fileStructure, draggableId);
          
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

  return { handleDragEnd };
}
